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

  async function handleLogin(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    const trimmedContact = contact.trim()

    const isEmail = trimmedContact.includes('@')

    let error

    if (isEmail) {
      const result = await supabase.auth.signInWithPassword({
        email: trimmedContact,
        password,
      })

      error = result.error
    } else {
      const normalizedPhone = trimmedContact.replace(/\s+/g, '')

      const result = await supabase.auth.signInWithPassword({
        phone: normalizedPhone,
        password,
      })

      error = result.error
    }

    if (error) {
      setMessage(
        error.message ||
          'Unable to sign in. Please check your credentials.'
      )
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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

      {/* Login Card */}
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

            <div className="mt-7">
              <h2 className="text-xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sign in to continue to your SafeSpace account
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-5 px-6 pb-8 sm:px-8"
          >

            {/* Email / Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email or Phone Number
              </label>

              <input
                type="text"
                placeholder="you@example.com or 09171234567"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Error */}
            {message && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {message}
              </div>
            )}

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white/90 px-3 text-xs text-slate-400">
                  New to CCTC SafeSpace?
                </span>
              </div>
            </div>

            {/* Register */}
            <Link
              href="/register"
              className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Create an Account
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