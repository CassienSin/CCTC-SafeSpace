'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')
    setMessageType('')

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    )

    if (error) {
      setMessage(error.message)
      setMessageType('error')
      setLoading(false)
      return
    }

    setMessage(
      'If an account exists with that email, a password reset link has been sent. Please check your inbox.'
    )
    setMessageType('success')
    setLoading(false)
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 pb-8 sm:px-8"
          >

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900">
                Forgot your password?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter the email address associated with your account and
                we'll send you a link to reset your password.
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>

            {/* Back */}
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