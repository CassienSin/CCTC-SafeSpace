'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import FaceLandmarkOverlay from '@/components/auth/FaceLandmarkOverlay'

const INSTRUCTIONS = {
  front: 'Look straight at the camera',
  left: 'Turn toward your own LEFT shoulder, keep your chin level',
  right: 'Turn toward your own RIGHT shoulder, keep your chin level',
  blink: 'Look straight. During capture, close and reopen your eyes',
}
const MAX_SCAN_RETRIES = 4

function waitFor(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Scan cancelled.', 'AbortError'))
      return
    }
    const cancel = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
      reject(new DOMException('Scan cancelled.', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel)
      resolve()
    }, ms)
    signal.addEventListener('abort', cancel, { once: true })
  })
}

// One sequential run: no overlapping captures or automatic retries on errors.
async function runTimedScans({ initial, isActive, sleep, now, onPrompt, onCountdown, onFeedback, capture, quick = false }) {
  if (!initial?.id || initial.step !== 0 || !Number.isFinite(initial.expiresIn) || initial.expiresIn <= 0) {
    throw new Error('Invalid scan challenge. Please start again.')
  }
  const deadline = now() + initial.expiresIn * 1000
  function check() {
    if (!isActive()) throw new DOMException('Scan cancelled.', 'AbortError')
    if (now() >= deadline) throw new Error('Scan expired. Please start a fresh scan.')
  }
  let challenge = initial
  let retryCount = 0
  let retrying = false
  let retryReason = null
  for (let step = 0; step < 5;) {
    check()
    if (challenge.step !== step || !Object.hasOwn(INSTRUCTIONS, challenge.prompt)) {
      throw new Error('Unexpected scan step. Please start again.')
    }
    onPrompt(challenge)
    const preparation = retrying && retryReason === 'liveness' ? 5 : quick
      ? retrying ? 3 : step === 0 ? 3 : challenge.prompt === 'blink' ? 2 : 0
      : 5
    for (let seconds = preparation; seconds > 0; seconds--) {
      check()
      onCountdown(seconds)
      await sleep(1000)
    }
    // Keep consecutive frontal frames fresh without another five-second prompt.
    if (preparation === 0) await sleep(250)
    check()
    onCountdown(null)
    const result = await capture(challenge)
    check()
    if (result?.retry === true) {
      retryCount++
      if (retryCount > MAX_SCAN_RETRIES || result.done || result.step !== step || result.prompt !== challenge.prompt
        || result.retriesRemaining !== MAX_SCAN_RETRIES - retryCount) {
        throw new Error('Unexpected retry response. Please start again.')
      }
      onFeedback?.(result.message || 'Adjust your head position and hold still.')
      retrying = true
      retryReason = result.reason
      // Keep the same step, accepted samples and original expiry deadline.
      continue
    }
    onFeedback?.('')
    retrying = false
    retryReason = null
    if (step === 4) {
      if (result?.done !== true) throw new Error('Scan did not finish. Please start again.')
      return result
    }
    if (result?.done || result?.step !== step + 1) {
      throw new Error('Unexpected scan response. Please start again.')
    }
    challenge = { ...challenge, ...result, id: initial.id }
    step++
  }
}

const field =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-indigo-500'

const primary =
  'w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'

function finishFaceLogin(successPath) {
  // Called only after the server has returned a completed login.
  try {
    sessionStorage.setItem('cctc_unlock_at', String(Date.now()))
  } catch {
    // Storage is a convenience; it never establishes authentication.
  }
  window.location.replace(successPath || '/dashboard')
}

export default function FaceLoginCamera({
  mode = 'login',
  initialEmail = '',
  successPath = '/dashboard',
}) {
  const enrolling = mode === 'enroll'

  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const streamRef = useRef(null)
  const abortRef = useRef(null)
  const runRef = useRef(0)
  const sequenceRef = useRef(null)
  const startingRef = useRef(false)

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [replace, setReplace] = useState(false)
  const [status, setStatus] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [busy, setBusy] = useState(false)
  const [camera, setCamera] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState('')
  const [frameBounds, setFrameBounds] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [poseHint, setPoseHint] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (!cooldownUntil) return
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownSeconds(remaining)
      if (remaining === 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownUntil])

  // Use the same contain-fit rectangle as the video, not the outer panel.
  // This also handles landscape webcams, portrait phones and rotation.
  useEffect(() => {
    const preview = previewRef.current
    const video = videoRef.current
    if (!preview || !video) return

    function measureFrame() {
      if (!video.videoWidth || !video.videoHeight) return
      const scale = Math.min(
        preview.clientWidth / video.videoWidth,
        preview.clientHeight / video.videoHeight,
      )
      const width = video.videoWidth * scale
      const height = video.videoHeight * scale
      const next = {
        left: (preview.clientWidth - width) / 2,
        top: (preview.clientHeight - height) / 2,
        width,
        height,
      }
      setFrameBounds((previous) =>
        previous && Object.keys(next).every((key) => previous[key] === next[key])
          ? previous
          : next,
      )
    }

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measureFrame)
      : null
    observer?.observe(preview)
    video.addEventListener('loadedmetadata', measureFrame)
    video.addEventListener('resize', measureFrame)
    window.addEventListener('resize', measureFrame)
    measureFrame()

    return () => {
      observer?.disconnect()
      video.removeEventListener('loadedmetadata', measureFrame)
      video.removeEventListener('resize', measureFrame)
      window.removeEventListener('resize', measureFrame)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const dispose = useCallback(() => {
    runRef.current++
    startingRef.current = false
    sequenceRef.current?.abort()
    abortRef.current?.abort()
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/face-login/status', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error)
        }

        return data
      })
      .then((data) => {
        setStatus(data)

        if (data.email) {
          setEmail(data.email)
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setMessage(
            'Unable to load face-login settings. Use password or Google.',
          )
        }
      })

    function hide() {
      if (document.visibilityState === 'hidden') {
        dispose()
        setCamera(false)
        setAttempt(null)
        setBusy(false)
        setCountdown(null)
        setProgress('')
        setPoseHint('')
        setMessage(
          'Camera stopped while this page was hidden. Start a fresh scan.',
        )
      }
    }

    document.addEventListener('visibilitychange', hide)

    return () => {
      controller.abort()
      dispose()
      document.removeEventListener('visibilitychange', hide)
    }
  }, [dispose])

  async function api(action, payload) {
    const controller = new AbortController()
    abortRef.current = controller

    const timer = setTimeout(() => controller.abort(), 45000)

    try {
      const response = await fetch(`/api/face-login/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: 'no-store',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          const supplied = Number(data.retryAfterSeconds || response.headers.get('Retry-After'))
          const seconds = Number.isFinite(supplied) && supplied > 0
            ? Math.min(900, Math.ceil(supplied)) : 900
          setCooldownUntil(Date.now() + seconds * 1000)
          setCooldownSeconds(seconds)
          throw new Error('Too many attempts. Wait for the countdown below, or use password or Google. No automatic retry will run.')
        }
        throw new Error(data.error || 'Scan failed. Please try again.')
      }

      return data
    } finally {
      clearTimeout(timer)

      if (abortRef.current === controller) {
        abortRef.current = null
      }
    }
  }

  async function start(event) {
    event.preventDefault()

    if (busy || startingRef.current || cooldownSeconds > 0) return
    startingRef.current = true

    const run = ++runRef.current
    const sequence = new AbortController()
    sequenceRef.current = sequence

    setMessage('')
    setSuccess(false)
    setBusy(true)
    setProgress('Opening camera…')
    setFrameBounds(null)
    setCountdown(null)
    setPoseHint('')

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          'Camera access requires HTTPS and a supported browser.',
        )
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'user' },
          // Keep the camera's native framing instead of asking a landscape
          // webcam for a portrait-shaped stream. Unsupported hints are ignored.
          resizeMode: { ideal: 'none' },
        },
      })

      if (run !== runRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream

      await videoRef.current.play()

      if (run !== runRef.current) return
      setProgress('Checking account and starting scan…')

      const result = await api('start', {
        purpose: mode,
        email,
        password: enrolling ? password : undefined,
        consent,
        replace,
      })

      if (run !== runRef.current) return

      setPassword('')
      setAttempt(result)
      setCamera(true)
      await runTimedScans({
        initial: result,
        quick: !enrolling,
        isActive: () => run === runRef.current && !sequence.signal.aborted,
        sleep: (ms) => waitFor(ms, sequence.signal),
        now: () => Date.now(),
        onPrompt: (challenge) => {
          setAttempt(challenge)
          setProgress(challenge.prompt === 'blink' ? 'Get ready to blink…' : 'Keep looking at the camera…')
        },
        onFeedback: (hint) => setPoseHint(hint),
        onCountdown: (seconds) => {
          setCountdown(seconds)
          if (seconds !== null) setProgress(`Get ready — capturing in ${seconds}…`)
        },
        capture: (challenge) => capture(challenge, run, sequence.signal),
      })

      if (run !== runRef.current) return
      stopCamera()
      setCamera(false)
      setAttempt(null)
      setCountdown(null)
      setPoseHint('')
      setSuccess(true)
      if (enrolling) {
        setStatus((previous) => ({ ...previous, enrolled: true, needsRenewal: false }))
        setReplace(false)
        setMessage('Face login is configured. You can now test it from the login screen.')
      } else {
        // Only the server response establishes authentication, never the timer.
        finishFaceLogin(successPath)
      }
    } catch (error) {
      if (run === runRef.current) {
        stopCamera()
        setCamera(false)
        setAttempt(null)
        setCountdown(null)
        setPoseHint('')
        setMessage(
          error.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow it in your browser, or use password or Google.'
            : error.name === 'AbortError'
              ? 'Request timed out. Please start again.'
              : error.message,
        )
      }
    } finally {
      if (run === runRef.current) {
        startingRef.current = false
        sequenceRef.current = null
        setBusy(false)
        setProgress('')
      }
    }
  }

  async function capture(challenge, run, signal) {
    const frames = []
    function checkActive() {
      if (run !== runRef.current || signal.aborted) {
        throw new DOMException('Scan cancelled.', 'AbortError')
      }
    }
    try {
      checkActive()
      const video = videoRef.current

      if (!video?.videoWidth || !streamRef.current?.active) {
        throw new Error('Camera stopped. Start a fresh scan.')
      }

      const scale = Math.min(
        640 / video.videoWidth,
        640 / video.videoHeight,
        1,
      )

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)

      const context = canvas.getContext('2d')
      if (!context) throw new Error('Camera capture is unavailable in this browser.')
      const count = challenge.prompt === 'blink' ? 20 : 1

      // Capture an open-eye baseline before the blink instruction.
      for (let i = 0; i < count; i++) {
        checkActive()

        setProgress(
          count === 1
            ? 'Capturing…'
            : i < 4
              ? 'Eyes open…'
              : i < 12
                ? 'Close your eyes briefly…'
                : 'Open your eyes again…',
        )

        // Let the on-screen instruction appear before taking each blink frame.
        if (count > 1) await waitFor(140, signal)
        checkActive()
        if (!streamRef.current?.active || video.readyState < 2) {
          throw new Error('Camera stopped. Start a fresh scan.')
        }

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height,
        )

        frames.push(
          canvas.toDataURL('image/jpeg', 0.82).split(',')[1],
        )

      }

      checkActive()
      setProgress('Checking securely on the server…')

      return await api('step', {
        id: challenge.id,
        step: challenge.step,
        frames,
      })
    } finally {
      frames.length = 0
    }
  }

  function cancel() {
    dispose()

    setCamera(false)
    setAttempt(null)
    setBusy(false)
    setProgress('')
    setCountdown(null)
    setPoseHint('')
    setMessage('Scan stopped. No automatic retry will run.')
  }

  async function disable() {
    if (
      busy ||
      !window.confirm(
        'Disable your optional face-login credential? Password and Google login will still work.',
      )
    ) {
      return
    }

    setBusy(true)
    setMessage('')

    try {
      await api('disable', { password })

      setPassword('')
      setSuccess(true)

      setStatus((previous) => ({
        ...previous,
        enrolled: false,
      }))

      setMessage('Face login disabled.')
    } catch (error) {
      setSuccess(false)
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <div className="mx-auto grid min-h-dvh w-full min-w-0 max-w-6xl grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section
          ref={previewRef}
          aria-label="Camera preview"
          className={`relative min-w-0 overflow-hidden bg-black ${
            camera ? 'h-[66dvh] min-h-80' : 'h-52'
          } lg:sticky lg:top-0 lg:h-dvh`}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            style={{ objectFit: 'contain', objectPosition: '50% 50%', transform: 'scaleX(-1)', transformOrigin: '50% 50%' }}
            className={`absolute inset-0 block h-full w-full max-w-none ${
              camera || busy ? '' : 'invisible'
            }`}
          />
          <FaceLandmarkOverlay videoRef={videoRef} active={camera} prompt={attempt?.prompt} />

          {!camera && !busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
              <svg
                viewBox="0 0 48 48"
                className="h-16 w-16 text-cyan-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M15 5H8a3 3 0 0 0-3 3v7m28-10h7a3 3 0 0 1 3 3v7M5 33v7a3 3 0 0 0 3 3h7m18 0h7a3 3 0 0 0 3-3v-7" />
                <ellipse cx="24" cy="23" rx="10" ry="14" />
                <path d="M18 21h2m8 0h2m-10 9q4 3 8 0" />
              </svg>

              <p>Camera is off</p>
            </div>
          )}

          {camera && (
            <>
              {frameBounds && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute flex items-center justify-center"
                  style={frameBounds}
                >
                  <div
                    className="rounded-[50%] border-2 border-dashed border-cyan-300/70"
                    style={{
                      width: Math.min(frameBounds.width * 0.65, frameBounds.height * 0.65 * 0.72),
                      height: Math.min(frameBounds.width * 0.65 / 0.72, frameBounds.height * 0.65),
                    }}
                  />
                  {countdown !== null && (
                    <span className="absolute rounded-full bg-black/65 px-7 py-3 text-5xl font-bold tabular-nums text-white">
                      {countdown}
                    </span>
                  )}
                </div>
              )}

              <div className="absolute inset-x-0 top-0 flex justify-between bg-gradient-to-b from-black/75 to-transparent p-4 text-sm">
                <span>Live camera</span>
                <span>Scan {attempt?.step + 1} of 5</span>
              </div>

              <div
                aria-live="polite"
                className="absolute inset-x-4 bottom-4 rounded-2xl bg-black/80 p-4 text-center backdrop-blur"
              >
                <p className="font-semibold">
                  {INSTRUCTIONS[attempt?.prompt]}
                </p>

                <p className="mt-1 text-sm text-cyan-200">
                  {progress}
                </p>
                <p className="mt-1 text-xs text-white/70">The mesh tracks your face; the server checks each capture separately.</p>
                {poseHint && <p className="mt-2 text-sm font-semibold text-amber-200">{poseHint} Retrying this scan only.</p>}
              </div>
            </>
          )}
        </section>

        <section className="min-w-0 bg-slate-50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-slate-900 sm:px-8 lg:flex lg:flex-col lg:justify-center lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <div className={camera ? 'hidden lg:block' : ''}>
              <Link
                href={enrolling ? '/dashboard/profile' : '/login'}
                className="text-sm font-semibold text-indigo-700"
              >
                ← {enrolling ? 'Back to profile' : 'Other sign-in options'}
              </Link>

              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-indigo-600">
                CCTC SafeSpace · experimental face login
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                {enrolling
                  ? 'Set up face login'
                  : 'Sign in with your face'}
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {enrolling
                  ? 'Optional camera sign-in, separate from your existing profile face scans.'
                  : 'Use the email and face you enrolled for this account. Password and Google login remain available.'}
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {enrolling
                    ? 'Enrollment uses five guided scans with head turns and a blink. Each starts after a five-second countdown. Light your face from the front and avoid bright lights or windows behind you.'
                  : 'Already enrolled? Press Start, look at the camera, and follow one blink prompt. Five identity samples are captured automatically without head turns.'}
                {' '}Keep your eyes open until instructed to blink. Up to four retries total for positioning or liveness are allowed without losing completed scans.
              </p>

              <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Experimental webcam recognition—not device Face ID or a
                hardware-backed passkey. A photo, replayed video, or
                manipulated camera input may defeat it. Keep password or
                Google sign-in available for sensitive accounts.
                {!enrolling && ' Face login is optional and uses fewer movement challenges than enrollment.'}
              </p>
            </div>

            {message && (
              <p
                role="status"
                className={`mt-4 rounded-xl p-3 text-sm ${
                  success
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {message}
              </p>
            )}

            {status?.enabled === false && (
              <p className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">
                Face login is currently disabled. Use password or Google
                to continue.
              </p>
            )}

            {cooldownSeconds > 0 && (
              <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                Try again in {Math.floor(cooldownSeconds / 60)}:{String(cooldownSeconds % 60).padStart(2, '0')}.
                {' '}The server still enforces account and network limits. Scanning will not restart automatically.
              </p>
            )}

            {!camera ? (
              <form onSubmit={start} className="mt-6 space-y-4">
                <label className="block text-sm font-semibold">
                  Account email
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    readOnly={enrolling}
                    disabled={busy}
                    className={field}
                  />
                </label>

                {enrolling && (
                  <>
                    <label className="block text-sm font-semibold">
                      Current password
                      <input
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        disabled={busy}
                        className={field}
                      />
                    </label>

                    {status?.enrolled && (
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={replace}
                          onChange={(event) =>
                            setReplace(event.target.checked)
                          }
                          disabled={busy}
                        />

                        <span>
                          Replace my existing face-login enrollment.
                        </span>
                      </label>
                    )}

                    {status?.needsRenewal && (
                      <p className="text-sm text-amber-800">
                        Your account changed. Re-enroll before using face
                        login.
                      </p>
                    )}

                    {status?.eligible === false && (
                      <p className="text-sm text-amber-800">
                        Face login is unavailable for this account. It
                        requires a confirmed email, a password, and no
                        verified MFA factor.
                      </p>
                    )}
                  </>
                )}

                <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(event) =>
                      setConsent(event.target.checked)
                    }
                    disabled={busy}
                    className="mt-1 h-4 w-4 shrink-0"
                  />

                  <span>
                    I agree to send camera frames to the SafeSpace server
                    for this check. The live landmark guide runs locally in
                    this browser and is not saved. Images are processed in memory, not
                    saved by this feature. Encrypted in-progress samples
                    expire after three minutes and are removed on cleanup;
                    keyed frame fingerprints are retained for up to one
                    day plus cleanup delay.{' '}
                    {enrolling &&
                      'An encrypted face template is saved until I disable it.'}
                  </span>
                </label>

                <button
                  className={primary}
                  disabled={
                    busy ||
                    cooldownSeconds > 0 ||
                    !status?.enabled ||
                    (enrolling && status?.eligible !== true) ||
                    (enrolling && status?.enrolled && !replace)
                  }
                >
                  {busy
                    ? progress || 'Please wait…'
                    : cooldownSeconds > 0 ? 'Please wait before retrying'
                      : enrolling ? 'Start Camera & Scan' : 'Start Face Login'}
                </button>

                {busy && (
                  <button type="button" onClick={cancel} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold">
                    Cancel and stop camera
                  </button>
                )}

                {enrolling && status?.enrolled && (
                  <button
                    type="button"
                    onClick={disable}
                    disabled={busy || !password}
                    className="w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Disable face login using password
                  </button>
                )}
              </form>
            ) : (
              <div className="space-y-3 lg:mt-6">
                <div
                  className="flex gap-2"
                  aria-label={`${attempt?.step || 0} of 5 scans complete`}
                >
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className={`h-2 flex-1 rounded-full ${
                        index < attempt.step
                          ? 'bg-emerald-500'
                          : index === attempt.step
                            ? 'bg-indigo-500'
                            : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <div role="status" className="rounded-xl bg-indigo-50 px-4 py-3 text-center text-sm font-semibold text-indigo-900">
                  {poseHint && <p className="mb-2 text-amber-900">{poseHint} Completed scans are kept. Preparing another capture of this position.</p>}
                  {progress || 'Preparing automatic scan…'}
                </div>

                <button
                  type="button"
                  onClick={cancel}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold"
                >
                  Cancel and stop camera
                </button>
              </div>
            )}

            {!enrolling && !camera && (
              <p className="mt-5 text-sm text-slate-600">
                Not enrolled?{' '}
                <Link
                  className="font-semibold text-indigo-700"
                  href="/dashboard/profile/face-login"
                >
                  Sign in normally, then set up face login
                </Link>
                .
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
