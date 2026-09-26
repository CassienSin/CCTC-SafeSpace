'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setReady(true)
      } else {
        setMessage(
          'This password reset link is invalid or has expired.'
        )
        setMessageType('error')
      }
    }

    checkSession()
  }, [supabase])

  async function handleResetPassword(e) {
    e.preventDefault()

    setMessage('')
    setMessageType('')

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      setMessageType('error')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
      setMessageType('error')
      setLoading(false)
      return
    }

    setMessage(
      'Your password has been changed successfully. Redirecting to login...'
    )
    setMessageType('success')

    await supabase.auth.signOut()

    setTimeout(() => {
      router.push('/login')
      router.refresh()
    }, 1800)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8">

      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/safespace-background.png')",
          }}
        />

        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />

        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-100/30" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">

        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl backdrop-blur-xl">

          {/* Header */}
          <div className="px-6 pb-5 pt-9 text-center sm:px-8">

            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <Image
                src="/school-logo.png"
                alt="School Logo"
                width={80}
                height={80}
                className="h-full w-full object-contain p-2"
                priority
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              CCTC SafeSpace
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Student Safety & Support
            </p>
          </div>

          <form
            onSubmit={handleResetPassword}
            className="space-y-5 px-6 pb-8 sm:px-8"
          >

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">
                Create a new password
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose a new password for your account.
              </p>
            </div>

            {!ready && !message && (
              <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                Verifying your reset link...
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                New Password
              </label>

              <input
                type="password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={!ready}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Confirm New Password
              </label>

              <input
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={!ready}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  messageType === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-600'
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>

            <Link
              href="/login"
              className="block text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Sign In
            </Link>

          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          CCTC SafeSpace • Student Safety & Support
        </p>

      </div>
    </main>
  )
}