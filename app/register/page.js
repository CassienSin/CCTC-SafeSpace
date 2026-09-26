'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [contact, setContact] = useState('')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()

    setMessage('')
    setMessageType('')

    const trimmedName = fullName.trim()
    const trimmedContact = contact.trim()
    const trimmedStudentId = studentId.trim()

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      setMessageType('error')
      return
    }

    if (!/^\d{8}$/.test(trimmedStudentId)) {
      setMessage('Student ID must contain exactly 8 digits.')
      setMessageType('error')
      return
    }

    const isEmail = trimmedContact.includes('@')

    if (isEmail) {
      const { error } = await supabase.auth.signUp({
        email: trimmedContact,
        password,
        options: {
          data: {
            full_name: trimmedName,
            student_id: trimmedStudentId,
          },
        },
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
        setLoading(false)
        return
      }
    } else {
      const normalizedPhone = trimmedContact.replace(/\s+/g, '')

      if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
        setMessage(
          'Please enter a valid email address or phone number.'
        )
        setMessageType('error')
        return
      }

      const { error } = await supabase.auth.signUp({
        phone: normalizedPhone,
        password,
        options: {
          data: {
            full_name: trimmedName,
            student_id: trimmedStudentId,
          },
        },
      })

      if (error) {
        setMessage(error.message)
        setMessageType('error')
        setLoading(false)
        return
      }
    }

    setMessage(
      isEmail
        ? 'Account created! Please check your email to verify your account.'
        : 'Account created successfully!'
    )

    setMessageType('success')

    setTimeout(() => {
      router.push('/login')
    }, 1800)

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
      <div className="relative z-10 w-full max-w-lg">

        <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl backdrop-blur-xl">

          {/* Header */}
          <div className="px-6 pb-5 pt-8 text-center sm:px-10">

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

            <div className="mt-6">
              <h2 className="text-xl font-bold text-slate-900">
                Create your account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Join the CCTC SafeSpace community
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleRegister}
            className="space-y-4 px-6 pb-8 sm:px-10"
          >

            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                You can use either your email address or phone number.
              </p>
            </div>

            {/* Student ID */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Student ID
              </label>

              <input
                type="text"
                inputMode="numeric"
                placeholder="20212056"
                value={studentId}
                onChange={(e) =>
                  setStudentId(
                    e.target.value.replace(/\D/g, '').slice(0, 8)
                  )
                }
                required
                maxLength={8}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm tracking-wider outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Example: 20212056
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={`rounded-xl p-3 text-sm ${
                  messageType === 'success'
                    ? 'border border-green-200 bg-green-50 text-green-700'
                    : 'border border-red-200 bg-red-50 text-red-600'
                }`}
              >
                {message}
              </div>
            )}

            {/* Register */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Login */}
            <p className="pt-2 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign in
              </Link>
            </p>

          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          CCTC SafeSpace • Student Safety & Support
        </p>

      </div>
    </main>
  )
}