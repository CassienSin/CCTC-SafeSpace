'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

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
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function SearchIcon({ className = 'h-5 w-5' }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

function MessageIcon({ className = 'h-5 w-5' }) {
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
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.5-3.3A7.4 7.4 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
      <path d="M8 11h.01" />
      <path d="M12 11h.01" />
      <path d="M16 11h.01" />
    </svg>
  )
}

function getInitials(name) {
  if (!name) return 'U'

  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarStyle(role) {
  if (role === 'counselor') {
    return 'from-violet-500 to-purple-600'
  }

  if (role === 'teacher') {
    return 'from-blue-500 to-cyan-600'
  }

  return 'from-slate-500 to-slate-700'
}

export default function NewMessagePage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState(null)
  const [staff, setStaff] = useState([])

  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function loadStaff() {
    try {
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      setCurrentUserId(user.id)

      const { data, error: staffError } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .in('role', ['teacher', 'counselor'])
        .neq('id', user.id)
        .order('full_name', {
          ascending: true,
        })

      if (staffError) {
        throw staffError
      }

      setStaff(data || [])
    } catch (err) {
      console.error('Failed to load staff:', err)

      setError(
        'Unable to load teachers and counselors.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  async function startConversation(recipientId) {
    if (!currentUserId || creating) {
      return
    }

    try {
      setCreating(true)
      setError('')

      const response = await fetch(
        '/api/messages/conversations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Unable to create conversation.'
        )
      }

      router.push(
        `/dashboard/messages/${data.conversationId}`
      )
    } catch (err) {
      console.error(
        'Failed to create conversation:',
        err
      )

      setError(
        err.message ||
          'Unable to start the conversation.'
      )

      setCreating(false)
    }
  }

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return staff
    }

    return staff.filter((person) => {
      const name =
        person.full_name?.toLowerCase() || ''

      const role =
        person.role?.toLowerCase() || ''

      return (
        name.includes(query) ||
        role.includes(query)
      )
    })
  }, [staff, search])

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
      <div className="mx-auto max-w-3xl">

        {/* Back */}
        <Link
          href="/dashboard/messages"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to messages
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <MessageIcon />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                New Message
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Choose a teacher or counselor to start a private conversation.
              </p>
            </div>

          </div>
        </div>

        {/* Main card */}
        <Card className="overflow-hidden">

          {/* Search */}
          <div className="border-b border-slate-200/80 p-4 sm:p-5">

            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search teachers or counselors..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-4">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Staff list */}
          <div className="divide-y divide-slate-100">

            {/* Loading */}
            {loading && (
              <div className="space-y-1 p-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-4 rounded-xl p-4"
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-200" />

                    <div className="flex-1">
                      <div className="h-3 w-36 rounded bg-slate-200" />

                      <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No staff */}
            {!loading &&
              filteredStaff.length === 0 && (
                <div className="px-6 py-14 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <MessageIcon className="h-7 w-7" />
                  </div>

                  <h2 className="mt-4 text-base font-bold text-slate-800">
                    {search
                      ? 'No one found'
                      : 'No support staff available'}
                  </h2>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {search
                      ? 'Try searching for a different name.'
                      : 'There are currently no teachers or counselors available for messaging.'}
                  </p>

                </div>
              )}

            {/* Staff */}
            {!loading &&
              filteredStaff.map((person) => {
                const name =
                  person.full_name ||
                  'School Staff'

                const role =
                  person.role || 'staff'

                return (
                  <button
                    key={person.id}
                    type="button"
                    disabled={creating}
                    onClick={() =>
                      startConversation(person.id)
                    }
                    className="group flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-blue-50/50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
                  >

                    {/* Avatar */}
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={name}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm ${getAvatarStyle(
                          role
                        )}`}
                      >
                        {getInitials(name)}
                      </div>
                    )}

                    {/* Information */}
                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-bold text-slate-800 group-hover:text-blue-700">
                        {name}
                      </p>

                      <p className="mt-1 text-xs font-medium capitalize text-slate-500">
                        {role}
                      </p>

                    </div>

                    {/* Action */}
                    <div className="shrink-0">

                      {creating ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-600">
                          Message
                        </span>
                      )}

                    </div>

                  </button>
                )
              })}

          </div>
        </Card>

        {/* Privacy / safety note */}
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">

          <div className="flex gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <MessageIcon className="h-4 w-4" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Your conversation is private
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Use SafeSpace messaging when you need to
                talk with a teacher or counselor about a
                concern or need support.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}