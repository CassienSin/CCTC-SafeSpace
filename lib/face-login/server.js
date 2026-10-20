import 'server-only'
import { createClient as makeClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomBytes, randomInt, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { seal, unseal, digest } from './crypto.mjs'
import { FaceError, MODEL, identityDecision, validEmbedding, MAX_POSE_RETRIES } from './policy.mjs'

const COOKIE = 'cctc_face_attempt'
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const FAILED = 'Face sign-in could not be completed. Use password or Google, or start a new scan.'
const EMPTY = { embeddings: [], structures: [], hashes: [], scores: [] }
const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
const reply = (data, status = 200) => NextResponse.json(data, {
  status, headers: { 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache' },
})

function admin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing server auth configuration')
  return makeClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: authOptions })
}
function requireEnabled() {
  if (process.env.FACE_LOGIN_ENABLED !== 'true') throw new FaceError('Face login is not enabled. Please use password or Google.', 503)
}
function sameOrigin(request) {
  const allowed = process.env.FACE_LOGIN_ORIGIN
  if (!allowed || request.headers.get('origin') !== allowed
    || request.headers.get('sec-fetch-site') === 'cross-site') throw new FaceError('Request not allowed.', 403)
}
async function body(request, max = 16000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new FaceError('JSON required.', 415)
  const reader = request.body?.getReader()
  if (!reader) throw new FaceError('Missing request body.')
  const chunks = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > max) { await reader.cancel(); throw new FaceError('Capture too large. Try again.', 413) }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Object required')
    return parsed
  }
  catch { throw new FaceError('Invalid request.') }
}
function emailValue(value) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    throw new FaceError('Enter your account email address.')
  return value.trim().toLowerCase()
}
async function limit(db, key, count, seconds = 900) {
  const { data, error } = await db.rpc('face_login_take_limit', { p_key: digest(key), p_limit: count, p_seconds: seconds })
  if (error) throw new Error('Rate limiter unavailable')
  if (data !== true) {
    // Read only this hashed limit's expiry; never clear or extend its window.
    const { data: window, error: windowError } = await db.from('face_login_limits')
      .select('expires_at').eq('key', digest(key)).maybeSingle()
    const expires = Date.parse(window?.expires_at)
    const failure = new FaceError('Too many attempts. Please wait before trying again, or use password or Google.', 429)
    failure.retryAfterSeconds = !windowError && Number.isFinite(expires)
      ? Math.max(1, Math.ceil((expires - Date.now()) / 1000)) : seconds
    throw failure
  }
}
async function account(db, email) {
  const { data, error } = await db.rpc('face_login_account', { p_email: email })
  if (error) throw new Error('Account validation unavailable')
  return data?.[0] || null
}
async function credential(db, id) {
  if (!id) return null
  const { data, error } = await db.from('face_login_credentials').select('*').eq('user_id', id).maybeSingle()
  if (error) throw new Error('Credential storage unavailable')
  return data
}
async function currentUser() {
  const client = await createClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new FaceError('Sign in with your password first.', 401)
  return data.user
}
async function reauthenticate(db, user, password) {
  if (typeof password !== 'string' || password.length < 1 || password.length > 512) throw new FaceError('Enter your current password.')
  const client = makeClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: authOptions })
  const { data, error } = await client.auth.signInWithPassword({ email: user.email, password })
  if (error || !data.user || !data.session || data.user.id !== user.id) throw new FaceError('Password verification failed.', 403)
  // Revoke only the temporary password-check session, not the user's browser session.
  const result = await db.auth.admin.signOut(data.session.access_token, 'local')
  if (result.error) throw new Error('Temporary session cleanup failed')
}
function promptPlan(purpose = 'enroll') {
  if (purpose === 'login') {
    // Reduced-challenge PILOT login: retain five identity samples and a blink
    // at a server-selected middle step. This is weaker than turn challenges;
    // enrollment alone cannot prove that a later login is a live person.
    const prompts = ['front', 'front', 'front', 'front', 'front']
    prompts[1 + randomInt(3)] = 'blink'
    return prompts
  }
  const turn = randomInt(2) ? ['left','right'] : ['right','left']
  // Five identity samples, with unpredictable order of the middle actions.
  const middle = ['blink', ...turn]
  for (let i = middle.length-1; i > 0; i--) { const j = randomInt(i+1); [middle[i],middle[j]] = [middle[j],middle[i]] }
  return ['front', ...middle, 'front']
}
async function status() {
  const enabled = process.env.FACE_LOGIN_ENABLED === 'true'
  if (!enabled) return reply({ enabled: false, enrolled: false })
  const client = await createClient()
  const { data } = await client.auth.getUser()
  if (!data.user) return reply({ enabled, enrolled: false })
  const db = admin(), user = data.user
  const allowed = user.email ? await account(db, user.email) : null
  const record = await credential(db, user.id)
  return reply({ enabled, email: user.email || '', eligible: allowed?.user_id === user.id,
    enrolled: !!record, needsRenewal: !!record && record.identity_stamp !== allowed?.identity_stamp })
}
async function start(request) {
  const input = await body(request)
  if (!['login','enroll'].includes(input.purpose)) throw new FaceError('Invalid scan purpose.')
  if (input.consent !== true) throw new FaceError('Confirm camera-processing consent before starting.')
  const db = admin()
  // Vercel owns this header; never accept an IP address from the JSON payload.
  const ip = process.env.VERCEL === '1' ? (request.headers.get('x-vercel-forwarded-for') || 'shared') : 'local'
  await limit(db, 'global:start', 100, 60)
  await limit(db, `ip:${ip}:start`, 12)
  let email, user, eligible
  if (input.purpose === 'enroll') {
    user = await currentUser()
    email = emailValue(user.email)
    await limit(db, `enroll:${user.id}`, 5)
    eligible = await account(db, email)
    if (!eligible || eligible.user_id !== user.id) throw new FaceError('Face login is unavailable for this account. Use a confirmed email, password, and an account without verified MFA.', 403)
    await reauthenticate(db, user, input.password)
  } else {
    email = emailValue(input.email)
    await limit(db, `login:${email}`, 5)
    eligible = await account(db, email)
  }
  const record = await credential(db, eligible?.user_id)
  if (input.purpose === 'enroll' && record && input.replace !== true)
    throw new FaceError('Confirm that you want to replace your existing face-login enrollment.')
  const canLogin = record && record.model === MODEL && record.identity_stamp === eligible?.identity_stamp
  // Dummy attempt for unknown/ineligible/unconfigured accounts: same public response.
  const id = randomUUID(), binding = randomBytes(32).toString('base64url'), prompts = promptPlan(input.purpose)
  const state = seal(EMPTY, `attempt:${id}`)
  const { error } = await db.from('face_login_attempts').insert({
    id, purpose: input.purpose, user_id: input.purpose === 'enroll' || canLogin ? eligible.user_id : null,
    binding_hash: digest(`binding:${binding}`), prompts, encrypted_state: state,
    credential_version: record?.version || null, identity_stamp: eligible?.identity_stamp || null,
    expires_at: new Date(Date.now()+180000).toISOString(),
  })
  if (error) throw new Error('Could not start face challenge')
  const response = reply({ id, step: 0, prompt: prompts[0], expiresIn: 180 })
  response.cookies.set(COOKIE, binding, { httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', path: '/api/face-login', maxAge: 180 })
  // Expired encrypted state/limits are removed without touching live attempts.
  await db.rpc('face_login_cleanup')
  return response
}

async function issueSession(db, userId, stamp, version) {
  const { data: lookup, error: lookupError } = await db.auth.admin.getUserById(userId)
  const user = lookup?.user
  if (lookupError || !user?.email || !user.email_confirmed_at) throw new FaceError(FAILED, 401)
  const eligible = await account(db,user.email)
  const beforeRecord = await credential(db,userId)
  if (!eligible || eligible.user_id !== userId || eligible.identity_stamp !== stamp
    || beforeRecord?.version !== version) throw new FaceError(FAILED,401)
  // This is a privileged custom-auth bridge, NOT a native Supabase biometric factor.
  // Never send links, OTPs, service keys or token hashes to the browser.
  const { data: link, error } = await db.auth.admin.generateLink({ type: 'magiclink', email: user.email })
  if (error || link?.user?.id !== userId || !link.properties?.hashed_token) throw new FaceError(FAILED,401)
  const cookieStore = await cookies(), pending = []
  const sessionClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookies: {
      getAll: () => cookieStore.getAll(), setAll: values => pending.push(...values),
    } })
  const verified = await sessionClient.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' })
  if (verified.error || verified.data.user?.id !== userId || !verified.data.session) throw new FaceError(FAILED,401)
  const after = await account(db,user.email)
  const afterRecord = await credential(db,userId)
  if (!after || after.user_id !== userId || after.identity_stamp !== stamp || afterRecord?.version !== version) {
    await db.auth.admin.signOut(verified.data.session.access_token, 'local')
    throw new FaceError(FAILED,401)
  }
  const response = reply({ done: true, redirect: '/dashboard' })
  for (const { name, value, options } of pending) response.cookies.set(name,value,options)
  response.cookies.set(COOKIE, '', { path: '/api/face-login', maxAge: 0 })
  return response
}
async function step(request) {
  const input = await body(request, 2600000)
  if (!UUID.test(input.id || '') || !Number.isInteger(input.step) || input.step < 0 || input.step > 4)
    throw new FaceError('Invalid challenge.')
  const binding = (await cookies()).get(COOKIE)?.value
  if (!binding) throw new FaceError('Scan expired. Please start again.',409)
  const db = admin()
  await limit(db, 'global:step', 500, 60)
  // Five accepted samples plus two TOTAL pose/liveness retries; no new starts.
  await limit(db, `attempt:${input.id}`, 5 + MAX_POSE_RETRIES, 180)
  const { data, error } = await db.rpc('face_login_claim', { p_id: input.id,
    p_binding: digest(`binding:${binding}`), p_step: input.step })
  if (error) throw new Error('Challenge store unavailable')
  const attempt = data?.[0]
  if (!attempt) throw new FaceError('Scan expired, already used, or active in another tab. Start again.',409)
  try {
    if (attempt.purpose === 'enroll' && (await currentUser()).id !== attempt.user_id) throw new FaceError('Account changed. Start again.',401)
    const state = unseal(attempt.encrypted_state, `attempt:${attempt.id}`)
    // An in-flight challenge created before the geometry fallback may not
    // have this transient encrypted field yet.
    if (!Array.isArray(state.structures)) state.structures = []
    const record = await credential(db, attempt.user_id)
    let reference = null
    if (attempt.purpose === 'login' && record && record.version === attempt.credential_version && record.model === MODEL) {
      reference = unseal(record.encrypted_template, `credential:${record.user_id}:${record.version}`)
      if (!Array.isArray(reference) || reference.length !== 5 || !reference.every(validEmbedding)) throw new Error('Invalid stored template')
    }
    const { scan } = await import('./runtime.cjs')
    const captured = await scan({ frames: input.frames, prompt: attempt.prompts[input.step], previous: state, reference })
    // Detect exact decoded-frame reuse across attempts for 24 hours. This does
    // NOT detect transformed images or fabricated video; retain user consent,
    // account eligibility checks, and the optional password/Google alternatives.
    const used = await db.from('face_login_frame_uses').insert(captured.hashes.map(hash => ({ hash:digest(`frame:${hash}`) })))
    if (used.error) {
      if (used.error.code === '23505') throw new FaceError('Reused capture detected. Start a fresh live scan.')
      throw new Error('Frame replay store unavailable')
    }
    // Reserve rejected-capture hashes too: a retry must contain fresh frames.
    state.hashes.push(...captured.hashes)
    if (captured.poseFeedback || captured.livenessFeedback) {
      const retries = state.poseRetries ?? 0
      if (!Number.isInteger(retries) || retries < 0 || retries >= MAX_POSE_RETRIES) {
        throw new FaceError('Scan retry limit reached. Start a new scan when ready, or use password or Google.')
      }
      state.poseRetries = retries + 1
      const { data: resumed, error: resumeError } = await db.from('face_login_attempts')
        .update({ busy: false, encrypted_state: seal(state,`attempt:${attempt.id}`) })
        .eq('id',attempt.id).eq('busy',true).eq('finished',false)
        .gt('expires_at',new Date().toISOString()).select('id')
      if (resumeError || resumed?.length !== 1) throw new FaceError('Scan expired. Start again.',409)
      return reply({ retry: true, step: input.step, prompt: attempt.prompts[input.step],
        reason: captured.livenessFeedback ? 'liveness' : 'pose',
        message: captured.livenessFeedback || captured.poseFeedback,
        retriesRemaining: MAX_POSE_RETRIES - state.poseRetries })
    }
    state.embeddings.push(captured.embedding); state.structures.push(captured.structure); state.scores.push(captured.score)
    if (input.step < 4) {
      const { data: updated, error: updateError } = await db.from('face_login_attempts')
        .update({ step: input.step+1, busy: false, encrypted_state: seal(state,`attempt:${attempt.id}`) })
        .eq('id',attempt.id).eq('busy',true).eq('finished',false).gt('expires_at',new Date().toISOString()).select('id')
      if (updateError || updated?.length !== 1) throw new FaceError('Scan expired. Start again.',409)
      return reply({ step: input.step+1, prompt: attempt.prompts[input.step+1] })
    }
    // Consume before any credential/session issuance; duplicates cannot mint sessions.
    const { data: consumed, error: consumeError } = await db.from('face_login_attempts')
      .update({ finished: true, step: 5, encrypted_state: seal(EMPTY,`attempt:${attempt.id}`) })
      .eq('id',attempt.id).eq('busy',true).eq('finished',false).gt('expires_at',new Date().toISOString()).select('id')
    if (consumeError || consumed?.length !== 1) throw new FaceError('Scan expired. Start again.',409)
    if (!attempt.user_id) throw new FaceError(FAILED,401)
    const { data: lookup, error: lookupError } = await db.auth.admin.getUserById(attempt.user_id)
    if (lookupError || !lookup?.user?.email) throw new FaceError(FAILED,401)
    const eligible = await account(db,lookup.user.email)
    if (!eligible || eligible.user_id !== attempt.user_id || eligible.identity_stamp !== attempt.identity_stamp)
      throw new FaceError('Account eligibility changed. Sign in with your password.',401)
    if (attempt.purpose === 'login') {
      const latest = await credential(db,attempt.user_id)
      if (!reference || !latest || latest.version !== attempt.credential_version || !identityDecision(state.scores))
        throw new FaceError(FAILED,401)
      return await issueSession(db,attempt.user_id,attempt.identity_stamp,attempt.credential_version)
    }
    const version = randomUUID()
    const values = { user_id: attempt.user_id, version, model: MODEL,
      identity_stamp: eligible.identity_stamp, updated_at: new Date().toISOString(),
      encrypted_template: seal(state.embeddings,`credential:${attempt.user_id}:${version}`) }
    const query = attempt.credential_version
      ? db.from('face_login_credentials').update(values).eq('user_id',attempt.user_id).eq('version',attempt.credential_version)
      : db.from('face_login_credentials').insert(values)
    const { data: saved, error: saveError } = await query.select('version')
    if (saveError || saved?.length !== 1) throw new FaceError('Enrollment changed or could not be saved. Sign in and try again.',409)
    const response = reply({ done: true, enrolled: true })
    response.cookies.set(COOKIE,'',{ path:'/api/face-login', maxAge:0 })
    return response
  } catch (error) {
    await db.from('face_login_attempts').update({ finished: true, encrypted_state: seal(EMPTY,`attempt:${attempt.id}`) }).eq('id',attempt.id)
    throw error
  }
}
async function disable(request) {
  const input = await body(request), user = await currentUser(), db = admin()
  await limit(db, `disable:${user.id}`, 5)
  await reauthenticate(db,user,input.password)
  const { error } = await db.from('face_login_credentials').delete().eq('user_id',user.id)
  if (error) throw new Error('Could not disable credential')
  const cancelled = await db.from('face_login_attempts').delete().eq('user_id',user.id)
  if (cancelled.error) throw new Error('Could not invalidate attempts')
  return reply({ disabled:true })
}
export async function handle(request, action) {
  try {
    if (request.method === 'GET' && action === 'status') return await status()
    if (request.method !== 'POST') return reply({ error: 'Method not allowed.' },405)
    sameOrigin(request)
    // Disabling remains available after the global kill switch is turned off.
    if (action === 'disable') return await disable(request)
    requireEnabled()
    if (action === 'start') return await start(request)
    if (action === 'step') return await step(request)
    return reply({ error: 'Not found.' },404)
  } catch (error) {
    // Never log captured frames, biometric templates, passwords or auth tokens.
    if (!(error instanceof FaceError)) console.error('Face login internal failure', { type: error?.name || 'Error' })
    const retryAfterSeconds = error instanceof FaceError && error.status === 429
      ? Math.max(1, Math.min(900, Math.ceil(error.retryAfterSeconds || 900))) : undefined
    const response = reply({ error: error instanceof FaceError ? error.message : 'Face login is unavailable. Use password or Google.',
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}) }, error instanceof FaceError ? error.status : 503)
    if (retryAfterSeconds) response.headers.set('Retry-After', String(retryAfterSeconds))
    return response
  }
}
