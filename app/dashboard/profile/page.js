'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function UserIcon({ className = 'h-5 w-5' }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

function MailIcon({ className = 'h-5 w-5' }) {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function PhoneIcon({ className = 'h-5 w-5' }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.08 3h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L9 10.73a16 16 0 0 0 4.27 4.27l1.27-1.25a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

function GraduationIcon({ className = 'h-5 w-5' }) {
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
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M7 11.5V16c2.8 2.2 7.2 2.2 10 0v-4.5" />
      <path d="M21 9v6" />
    </svg>
  )
}

function ShieldIcon({ className = 'h-5 w-5' }) {
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
      <path d="M12 3 5 6v5c0 4.8 2.9 8.5 7 10 4.1-1.5 7-5.2 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function CalendarIcon({ className = 'h-5 w-5' }) {
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
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function CheckIcon({ className = 'h-5 w-5' }) {
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

function getInitials(name) {
  if (!name) return 'U'

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatRole(role) {
  if (!role) return 'User'

  return role
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
}

function getRoleStyle(role) {
  if (role === 'admin') {
    return 'bg-slate-100 text-slate-700 ring-slate-200'
  }

  if (role === 'teacher') {
    return 'bg-blue-50 text-blue-700 ring-blue-200'
  }

  if (role === 'counselor') {
    return 'bg-violet-50 text-violet-700 ring-violet-200'
  }

  return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
}

function formatDate(dateString) {
  if (!dateString) return '—'

  return new Date(dateString).toLocaleDateString(
    [],
    {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [editing, setEditing] = useState(false)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      const {
        data,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email, phone, role, student_id, avatar_url, created_at, updated_at'
        )
        .eq('id', currentUser.id)
        .single()

      if (profileError) {
        throw profileError
      }

      setProfile(data)
      setFullName(data?.full_name || '')
      setPhone(data?.phone || '')
    } catch (err) {
      console.error(
        'Failed to load profile:',
        err
      )

      setError(
        err.message ||
          'Failed to load your profile.'
      )
    } finally {
      setLoading(false)
    }
  }

  function startEditing() {
    setError('')
    setSuccess('')

    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')

    setEditing(true)
  }

  function cancelEditing() {
    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')

    setError('')
    setEditing(false)
  }

  async function saveProfile() {
    const cleanedName = fullName.trim()
    const cleanedPhone = phone.trim()

    if (!cleanedName) {
      setError('Full name is required.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from('profiles')
        .update({
          full_name: cleanedName,
          phone: cleanedPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select(
          'id, full_name, email, phone, role, student_id, avatar_url, created_at, updated_at'
        )
        .single()

      if (updateError) {
        throw updateError
      }

      setProfile(updatedProfile)
      setFullName(updatedProfile.full_name || '')
      setPhone(updatedProfile.phone || '')

      setEditing(false)
      setSuccess(
        'Your profile has been updated successfully.'
      )
    } catch (err) {
      console.error(
        'Failed to update profile:',
        err
      )

      setError(
        err.message ||
          'Failed to update your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  function handleChangePassword() {
  router.push('/dashboard/change-password')
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl animate-pulse">
          <div className="h-8 w-48 rounded-lg bg-slate-200" />
          <div className="mt-3 h-4 w-72 rounded bg-slate-100" />

          <div className="mt-8 h-56 rounded-2xl bg-slate-100" />

          <div className="mt-6 h-80 rounded-2xl bg-slate-100" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserIcon className="h-7 w-7" />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              We couldn't find your profile information.
            </p>

            <div className="mt-6">
              <Button
                variant="primary"
                onClick={loadProfile}
              >
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your CCTC SafeSpace account information.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <div className="mt-0.5">
              <CheckIcon className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold">
                Success
              </p>

              <p className="mt-1">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* Profile hero */}
        <Card className="mt-6 overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 sm:h-36" />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'Profile'}
                    className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-600 to-indigo-700 text-2xl font-bold text-white shadow-lg sm:h-28 sm:w-28">
                    {getInitials(
                      profile.full_name
                    )}
                  </div>
                )}

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                      {profile.full_name ||
                        'Unnamed User'}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${getRoleStyle(
                        profile.role
                      )}`}
                    >
                      {formatRole(
                        profile.role
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.email ||
                      user?.email ||
                      'No email'}
                  </p>
                </div>
              </div>

              {!editing && (
                <Button
                  variant="primary"
                  onClick={startEditing}
                >
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <GraduationIcon />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Student ID
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {profile.student_id ||
                      'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldIcon />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Account Status
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-emerald-600">
                    Active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <CalendarIcon />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Member Since
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-700">
                    {formatDate(
                      profile.created_at
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Personal information */}
        <Card className="mt-6 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserIcon />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Personal Information
              </h2>

              <p className="text-xs text-slate-500">
                Your basic account information.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {/* Full name */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Full Name
              </label>

              {editing ? (
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                />
              ) : (
                <div className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <UserIcon className="h-4 w-4 text-slate-400" />

                  <span className="text-sm font-medium text-slate-700">
                    {profile.full_name ||
                      'Not provided'}
                  </span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>

              <div className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <MailIcon className="h-4 w-4 text-slate-400" />

                <span className="truncate text-sm font-medium text-slate-700">
                  {profile.email ||
                    user?.email ||
                    'Not provided'}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                Email is managed through your
                authentication account.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500"
              >
                Phone Number
              </label>

              {editing ? (
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="Enter your phone number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                />
              ) : (
                <div className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <PhoneIcon className="h-4 w-4 text-slate-400" />

                  <span className="text-sm font-medium text-slate-700">
                    {profile.phone ||
                      'Not provided'}
                  </span>
                </div>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Student ID
              </label>

              <div className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <GraduationIcon className="h-4 w-4 text-slate-400" />

                <span className="text-sm font-medium text-slate-700">
                  {profile.student_id ||
                    'Not provided'}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                Student ID cannot be changed here.
              </p>
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : 'Save Changes'}
              </Button>
            </div>
          )}
        </Card>

        {/* Account information */}
        <Card className="mt-6 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldIcon />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Account Information
              </h2>

              <p className="text-xs text-slate-500">
                Details about your SafeSpace account.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account Role
              </p>

              <div className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${getRoleStyle(
                    profile.role
                  )}`}
                >
                  {formatRole(
                    profile.role
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Member Since
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {formatDate(
                  profile.created_at
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account ID
              </p>

              <p className="mt-2 break-all font-mono text-xs text-slate-600">
                {profile.id}
              </p>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="mt-6 p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldIcon />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Account Security
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Keep your account secure by
                  regularly updating your password.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={handleChangePassword}
            >
              Change Password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}