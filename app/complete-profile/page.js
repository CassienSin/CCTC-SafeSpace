'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function CompleteProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [studentId, setStudentId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      setFullName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          ''
      )

      setEmail(user.email || '')
      setLoading(false)
    }

    loadUser()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    setMessage('')

    const trimmedStudentId = studentId.trim()

    // Exactly 8 digits
    if (!/^\d{8}$/.test(trimmedStudentId)) {
      setMessage('Student ID must contain exactly 8 digits.')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    // Check whether another account already has this Student ID
    const { data: existingProfile, error: checkError } =
      await supabase
        .from('profiles')
        .select('id')
        .eq('student_id', trimmedStudentId)
        .maybeSingle()

    if (checkError) {
      setMessage(
        checkError.message ||
          'Unable to verify your Student ID.'
      )
      setSaving(false)
      return
    }

    if (existingProfile && existingProfile.id !== user.id) {
      setMessage(
        'That Student ID is already associated with another account.'
      )
      setSaving(false)
      return
    }

    // Save Student ID
    const { error: updateError } =
      await supabase
        .from('profiles')
        .update({
          student_id: trimmedStudentId,
        })
        .eq('id', user.id)

    if (updateError) {
      setMessage(
        updateError.message ||
          'Unable to save your Student ID.'
      )
      setSaving(false)
      return
    }

    router.replace('/dashboard')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading your account...
        </p>
      </main>
    )
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
            backgroundImage:
              "url('/safespace-background.png')",
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

            <div className="mt-7">
              <h2 className="text-xl font-bold text-slate-900">
                Complete Your Profile
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                One more step before you can access
                your SafeSpace account.
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 px-6 pb-8 sm:px-8"
          >
            {/* Google account information */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Google Account
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {fullName || 'Google User'}
              </p>

              <p className="mt-0.5 text-sm text-slate-500">
                {email}
              </p>
            </div>

            {/* Student ID */}
            <div>
              <label
                htmlFor="studentId"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                CCTC Student ID
              </label>

              <input
                id="studentId"
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="Enter your 8-digit Student ID"
                value={studentId}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 8)

                  setStudentId(value)
                }}
                required
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm tracking-wider outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-xs text-slate-400">
                Your Student ID must contain exactly 8 digits.
              </p>
            </div>

            {/* Error */}
            {message && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {message}
              </div>
            )}

            {/* Continue */}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Continue to SafeSpace'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          CCTC SafeSpace • Student Safety & Support
        </p>
      </div>
    </main>
  )
}