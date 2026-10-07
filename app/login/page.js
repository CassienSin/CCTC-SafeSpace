'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function finishPasswordLogin(user) {
    const { data: enrollment, error } = await supabase
      .from('face_enrollments')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      await supabase.auth.signOut()
      throw new Error('Unable to check your face-verification profile.')
    }

    sessionStorage.removeItem('cctc_unlock_at')

    if (enrollment) {
      router.replace('/auth/unlock/face?next=/dashboard')
      return
    }

    sessionStorage.setItem('cctc_unlock_at', String(Date.now()))
    router.replace('/dashboard')
    router.refresh()
  }

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const trimmedContact = contact.trim()
      const credentials = trimmedContact.includes('@')
        ? { email: trimmedContact, password }
        : { phone: trimmedContact.replace(/\s+/g, ''), password }

      const { data, error } = await supabase.auth.signInWithPassword(credentials)

      if (error) throw error
      if (!data.user) throw new Error('No authenticated user was returned.')

      await finishPasswordLogin(data.user)
    } catch (error) {
      setMessage(error?.message || 'Unable to sign in. Please check your credentials.')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message || 'Unable to sign in with Google.')
      setGoogleLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm !text-slate-900 placeholder:text-slate-400 outline-none transition [color-scheme:light] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/safespace-background.png')" }} />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-100/30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl backdrop-blur-xl">
          <div className="px-6 pb-5 pt-9 text-center sm:px-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <Image src="/school-logo.png" alt="School Logo" width={80} height={80} className="h-full w-full object-contain p-2" priority />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">CCTC SafeSpace</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Student Safety &amp; Support</p>
            <div className="mt-7">
              <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to continue to your SafeSpace account</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 px-6 pb-8 sm:px-8">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email or Phone Number</label>
              <input type="text" placeholder="you@example.com or 09171234567" value={contact} onChange={(event) => setContact(event.target.value)} required autoComplete="username" className={inputClass} />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Forgot password?</Link>
              </div>
              <input type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className={inputClass} />
            </div>

            {message && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{message}</div>}

            <button type="submit" disabled={loading || googleLoading} className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white/90 px-3 text-xs text-slate-500">OR</span></div>
            </div>

            <button type="button" onClick={handleGoogleLogin} disabled={loading || googleLoading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              {googleLoading ? 'Connecting to Google...' : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.55-.23-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.92-4.18 2.92-7.42Z" />
                    <path fill="#34A853" d="M12 21.73c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.73Z" />
                    <path fill="#FBBC05" d="M6.54 13.82A5.85 5.85 0 0 1 6.23 12c0-.63.11-1.24.31-1.82V7.65H3.29A9.73 9.73 0 0 0 2.27 12c0 1.57.38 3.06 1.02 4.35l3.25-2.53Z" />
                    <path fill="#EA4335" d="M12 6.15c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.15 14.63 2.27 12 2.27a9.74 9.74 0 0 0-8.71 5.38l3.25 2.53C7.31 7.87 9.46 6.15 12 6.15Z" />
                  </svg>
                  Login with Google
                </>
              )}
            </button>

            <div className="relative py-1 text-center text-xs text-slate-500">New to CCTC SafeSpace?</div>
            <Link href="/register" className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Create an Account</Link>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">CCTC SafeSpace • Student Safety &amp; Support</p>
      </div>
    </main>
  )
}
