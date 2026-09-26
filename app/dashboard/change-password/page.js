'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function LockIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.3A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.3 18.3 0 0 1-3.1 4.3" />
      <path d="M6.6 6.6C3.7 8.5 2 12 2 12s3.5 8 10 8c1.5 0 2.8-.3 4-.9" />
    </svg>
  )
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function AlertIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  )
}

function ArrowLeftIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
}

function getPasswordStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: '',
    }
  }

  let score = 0

  if (password.length >= 8) {
    score++
  }

  if (/[a-z]/.test(password)) {
    score++
  }

  if (/[A-Z]/.test(password)) {
    score++
  }

  if (/[0-9]/.test(password)) {
    score++
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++
  }

  if (score <= 2) {
    return {
      score,
      label: 'Weak',
    }
  }

  if (score <= 3) {
    return {
      score,
      label: 'Fair',
    }
  }

  if (score === 4) {
    return {
      score,
      label: 'Good',
    }
  }

  return {
    score,
    label: 'Strong',
  }
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] =
    useState('')
  const [newPassword, setNewPassword] =
    useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [showCurrent, setShowCurrent] =
    useState(false)
  const [showNew, setShowNew] =
    useState(false)
  const [showConfirm, setShowConfirm] =
    useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword]
  )

  const requirements = useMemo(
    () => [
      {
        label: 'At least 8 characters',
        valid: newPassword.length >= 8,
      },
      {
        label: 'Contains an uppercase letter',
        valid: /[A-Z]/.test(newPassword),
      },
      {
        label: 'Contains a lowercase letter',
        valid: /[a-z]/.test(newPassword),
      },
      {
        label: 'Contains a number',
        valid: /[0-9]/.test(newPassword),
      },
      {
        label: 'Contains a special character',
        valid: /[^A-Za-z0-9]/.test(
          newPassword
        ),
      },
    ],
    [newPassword]
  )

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setLoading(false)
    } catch (err) {
      console.error(
        'Failed to verify account:',
        err
      )

      setError(
        'Unable to verify your account.'
      )

      setLoading(false)
    }
  }

  function validatePassword() {
    if (!currentPassword) {
      return 'Please enter your current password.'
    }

    if (!newPassword) {
      return 'Please enter a new password.'
    }

    if (newPassword.length < 8) {
      return 'Your new password must be at least 8 characters long.'
    }

    if (!/[A-Z]/.test(newPassword)) {
      return 'Your new password must contain at least one uppercase letter.'
    }

    if (!/[a-z]/.test(newPassword)) {
      return 'Your new password must contain at least one lowercase letter.'
    }

    if (!/[0-9]/.test(newPassword)) {
      return 'Your new password must contain at least one number.'
    }

    if (
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      return 'Your new password must contain at least one special character.'
    }

    if (newPassword === currentPassword) {
      return 'Your new password must be different from your current password.'
    }

    if (!confirmPassword) {
      return 'Please confirm your new password.'
    }

    if (newPassword !== confirmPassword) {
      return 'The new passwords do not match.'
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const validationError =
      validatePassword()

    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)

    try {
      /*
       * Supabase does not accept the current password
       * as part of updateUser().
       *
       * We verify it first by signing in with the
       * current user's email and current password.
       */
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.email) {
        setError(
          'Your account does not have an email address available for password verification.'
        )
        return
      }

      const {
        error: verifyError,
      } = await supabase.auth.signInWithPassword(
        {
          email: user.email,
          password: currentPassword,
        }
      )

      if (verifyError) {
        setError(
          'Your current password is incorrect.'
        )
        return
      }

      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw updateError
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setSuccess(
        'Your password has been changed successfully.'
      )
    } catch (err) {
      console.error(
        'Failed to change password:',
        err
      )

      setError(
        err.message ||
          'Failed to change your password. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl animate-pulse">
          <div className="h-8 w-56 rounded-lg bg-slate-200" />
          <div className="mt-3 h-4 w-80 rounded bg-slate-100" />

          <div className="mt-8 h-[520px] rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <button
          type="button"
          onClick={() =>
            router.push('/dashboard/profile')
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Profile
        </button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Change Password
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Update your password to keep your
            CCTC SafeSpace account secure.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Password change failed
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <div className="mt-0.5">
              <CheckIcon className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold">
                Password updated
              </p>

              <p className="mt-1">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Main card */}
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 px-5 py-6 sm:px-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <LockIcon className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Secure your account
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Choose a strong password that you
                  don't use on other websites.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-7"
          >
            {/* Current password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Current Password
              </label>

              <div className="relative">
                <input
                  id="currentPassword"
                  type={
                    showCurrent
                      ? 'text'
                      : 'password'
                  }
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrent(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={
                    showCurrent
                      ? 'Hide current password'
                      : 'Show current password'
                  }
                >
                  {showCurrent ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="mt-6">
              <label
                htmlFor="newPassword"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                New Password
              </label>

              <div className="relative">
                <input
                  id="newPassword"
                  type={
                    showNew
                      ? 'text'
                      : 'password'
                  }
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Enter your new password"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNew(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={
                    showNew
                      ? 'Hide new password'
                      : 'Show new password'
                  }
                >
                  {showNew ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Strength */}
              {newPassword && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Password strength
                    </span>

                    <span
                      className={`text-[11px] font-bold ${
                        passwordStrength.label ===
                        'Weak'
                          ? 'text-red-500'
                          : passwordStrength.label ===
                              'Fair'
                            ? 'text-amber-500'
                            : passwordStrength.label ===
                                'Good'
                              ? 'text-blue-600'
                              : 'text-emerald-600'
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="mt-2 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(
                      (level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition ${
                            level <=
                            passwordStrength.score
                              ? 'bg-blue-600'
                              : 'bg-slate-100'
                          }`}
                        />
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="mt-6">
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  type={
                    showConfirm
                      ? 'text'
                      : 'password'
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm(
                      (value) => !value
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label={
                    showConfirm
                      ? 'Hide password confirmation'
                      : 'Show password confirmation'
                  }
                >
                  {showConfirm ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                    newPassword ===
                    confirmPassword
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}
                >
                  {newPassword ===
                  confirmPassword ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Passwords match
                    </>
                  ) : (
                    'Passwords do not match'
                  )}
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Password Requirements
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {requirements.map(
                  (requirement) => (
                    <div
                      key={requirement.label}
                      className={`flex items-center gap-2 text-xs font-medium ${
                        requirement.valid
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full ${
                          requirement.valid
                            ? 'bg-emerald-100'
                            : 'bg-slate-200'
                        }`}
                      >
                        {requirement.valid && (
                          <CheckIcon className="h-3 w-3" />
                        )}
                      </div>

                      {requirement.label}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  router.push(
                    '/dashboard/profile'
                  )
                }
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving
                  ? 'Updating Password...'
                  : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Security note */}
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
          <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

          <p className="text-xs leading-relaxed text-slate-500">
            Your password is securely handled by
            Supabase Authentication. SafeSpace does
            not store your password in the profiles
            database.
          </p>
        </div>
      </div>
    </div>
  )
}