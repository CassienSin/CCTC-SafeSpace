'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const roles = [
  'student',
  'teacher',
  'counselor',
  'admin',
]

function UsersIcon({ className = 'h-5 w-5' }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function StaffIcon({ className = 'h-5 w-5' }) {
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
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

function TrashIcon({ className = 'h-4 w-4' }) {
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
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
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

function getAvatarStyle(role) {
  if (role === 'counselor') {
    return 'from-violet-500 to-purple-600'
  }

  if (role === 'teacher') {
    return 'from-blue-500 to-cyan-600'
  }

  if (role === 'admin') {
    return 'from-slate-600 to-slate-800'
  }

  return 'from-blue-600 to-indigo-600'
}

function formatRole(role) {
  if (!role) return 'Unknown'

  return role
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
}

function getRoleBadgeStyle(role) {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )
}

export default function UsersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const [updatingUser, setUpdatingUser] =
    useState(null)

  const [showRoleConfirm, setShowRoleConfirm] =
    useState(false)

  const [pendingRoleChange, setPendingRoleChange] =
    useState(null)

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false)

  const [pendingDeleteUser, setPendingDeleteUser] =
    useState(null)

  const [deletingUser, setDeletingUser] =
    useState(false)

  const [currentUserId, setCurrentUserId] =
    useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setCurrentUserId(user.id)

    const {
      data: currentProfile,
      error: currentProfileError,
    } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (
      currentProfileError ||
      currentProfile?.role !== 'admin'
    ) {
      router.push('/dashboard')
      return
    }

    const {
      data,
      error: usersError,
    } = await supabase
      .from('profiles')
      .select(
        'id, full_name, email, role, student_id, avatar_url, created_at'
      )
      .order('created_at', {
        ascending: false,
      })

    if (usersError) {
      setError(usersError.message)
    } else {
      setUsers(data || [])
    }

    setLoading(false)
  }

  function requestRoleChange(userId, newRole) {
    const selectedUser = users.find(
      (user) => user.id === userId
    )

    if (
      !selectedUser ||
      selectedUser.role === newRole
    ) {
      return
    }

    setPendingRoleChange({
      userId,
      newRole,
      userName:
        selectedUser.full_name ||
        selectedUser.email ||
        'this user',
      currentRole: selectedUser.role,
    })

    setShowRoleConfirm(true)
  }

  async function handleRoleChange() {
    if (!pendingRoleChange) return

    const { userId, newRole } =
      pendingRoleChange

    setUpdatingUser(userId)
    setError('')

    try {
      const response = await fetch(
        '/api/admin/users/role',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            userId,
            role: newRole,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Failed to update role.'
        )
        return
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: newRole,
              }
            : user
        )
      )

      setShowRoleConfirm(false)
      setPendingRoleChange(null)
    } catch (err) {
      console.error(
        'Failed to update role:',
        err
      )

      setError(
        'Unable to update the user role.'
      )
    } finally {
      setUpdatingUser(null)
    }
  }

  function requestDeleteUser(userId) {
    const selectedUser = users.find(
      (user) => user.id === userId
    )

    if (!selectedUser) return

    setPendingDeleteUser({
      userId,
      userName:
        selectedUser.full_name ||
        selectedUser.email ||
        'this user',
      email: selectedUser.email || '',
      role: selectedUser.role,
    })

    setShowDeleteConfirm(true)
  }

  async function handleDeleteUser() {
    if (!pendingDeleteUser) return

    const { userId } =
      pendingDeleteUser

    setDeletingUser(true)
    setError('')

    try {
      const response = await fetch(
        '/api/admin/users/delete',
        {
          method: 'DELETE',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            userId,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Failed to delete user.'
        )
        return
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (user) => user.id !== userId
        )
      )

      setShowDeleteConfirm(false)
      setPendingDeleteUser(null)
    } catch (err) {
      console.error(
        'Failed to delete user:',
        err
      )

      setError(
        'Unable to delete the user.'
      )
    } finally {
      setDeletingUser(false)
    }
  }

  const filteredUsers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    return users.filter((user) => {
      const matchesRole =
        roleFilter === 'all' ||
        user.role === roleFilter

      if (!matchesRole) return false

      if (!query) return true

      const name =
        user.full_name?.toLowerCase() || ''

      const email =
        user.email?.toLowerCase() || ''

      const studentId =
        user.student_id?.toLowerCase() || ''

      return (
        name.includes(query) ||
        email.includes(query) ||
        studentId.includes(query)
      )
    })
  }, [users, search, roleFilter])

  const statistics = useMemo(() => {
    return {
      total: users.length,
      students: users.filter(
        (user) => user.role === 'student'
      ).length,
      staff: users.filter(
        (user) =>
          user.role === 'teacher' ||
          user.role === 'counselor'
      ).length,
      admins: users.filter(
        (user) => user.role === 'admin'
      ).length,
    }
  }, [users])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-56 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-80 rounded bg-slate-100" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-slate-100"
                />
              ))}
            </div>

            <div className="mt-6 h-20 rounded-2xl bg-slate-100" />

            <div className="mt-6 h-96 rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <UsersIcon className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  User Management
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage CCTC SafeSpace accounts
                  and user roles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            <div>
              <p className="font-semibold">
                Something went wrong
              </p>
              <p className="mt-1">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              className="shrink-0 text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Users
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {statistics.total}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UsersIcon />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Students
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {statistics.students}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <GraduationIcon />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Staff
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {statistics.staff}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <StaffIcon />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Administrators
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {statistics.admins}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldIcon />
              </div>
            </div>
          </Card>
        </div>

        {/* Search and filters */}
        <Card className="mt-6 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <SearchIcon className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name, email, or student ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setRoleFilter('all')
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  roleFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>

              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() =>
                    setRoleFilter(role)
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    roleFilter === role
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formatRole(role)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400">
              Showing{' '}
              <span className="text-slate-600">
                {filteredUsers.length}
              </span>{' '}
              of{' '}
              <span className="text-slate-600">
                {users.length}
              </span>{' '}
              users
            </p>

            {(search || roleFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('all')
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>

        {/* Desktop table */}
        <Card className="mt-6 hidden overflow-hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    User
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Student ID
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                    Joined
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const name =
                    user.full_name ||
                    'Unnamed User'

                  const isCurrentUser =
                    user.id === currentUserId

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={name}
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${getAvatarStyle(
                                user.role
                              )}`}
                            >
                              {getInitials(name)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {name}
                            </p>

                            {isCurrentUser && (
                              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                                You
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {user.email ||
                          'No email'}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {user.student_id || '—'}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${getRoleBadgeStyle(
                              user.role
                            )}`}
                          >
                            {formatRole(
                              user.role
                            )}
                          </span>

                          <select
                            value={user.role}
                            onChange={(event) =>
                              requestRoleChange(
                                user.id,
                                event.target.value
                              )
                            }
                            disabled={
                              updatingUser ===
                              user.id
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                            aria-label={`Change role for ${name}`}
                          >
                            {roles.map(
                              (role) => (
                                <option
                                  key={role}
                                  value={role}
                                >
                                  {formatRole(
                                    role
                                  )}
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        {updatingUser ===
                          user.id && (
                          <p className="mt-1 text-[10px] font-semibold text-blue-600">
                            Saving...
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(
                          user.created_at
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            requestDeleteUser(
                              user.id
                            )
                          }
                          disabled={
                            deletingUser ||
                            isCurrentUser
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3.5 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            isCurrentUser
                              ? 'You cannot delete your own account'
                              : 'Delete user'
                          }
                        >
                          <TrashIcon />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <SearchIcon className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-base font-bold text-slate-800">
                No users found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or
                role filter.
              </p>
            </div>
          )}
        </Card>

        {/* Mobile cards */}
        <div className="mt-6 space-y-3 lg:hidden">
          {filteredUsers.map((user) => {
            const name =
              user.full_name ||
              'Unnamed User'

            const isCurrentUser =
              user.id === currentUserId

            return (
              <Card
                key={user.id}
                className="p-4"
              >
                <div className="flex items-start gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${getAvatarStyle(
                        user.role
                      )}`}
                    >
                      {getInitials(name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {name}
                        </p>

                        {isCurrentUser && (
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            You
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${getRoleBadgeStyle(
                          user.role
                        )}`}
                      >
                        {formatRole(
                          user.role
                        )}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {user.email ||
                        'No email'}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Student ID
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {user.student_id ||
                            '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Joined
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formatDate(
                            user.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          requestRoleChange(
                            user.id,
                            event.target.value
                          )
                        }
                        disabled={
                          updatingUser ===
                          user.id
                        }
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
                        aria-label={`Change role for ${name}`}
                      >
                        {roles.map(
                          (role) => (
                            <option
                              key={role}
                              value={role}
                            >
                              {formatRole(
                                role
                              )}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          requestDeleteUser(
                            user.id
                          )
                        }
                        disabled={
                          deletingUser ||
                          isCurrentUser
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3.5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <TrashIcon />
                        Delete
                      </button>
                    </div>

                    {updatingUser ===
                      user.id && (
                      <p className="mt-2 text-[10px] font-semibold text-blue-600">
                        Saving role...
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredUsers.length === 0 && (
            <Card className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <SearchIcon className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-base font-bold text-slate-800">
                No users found
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or
                role filter.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Role confirmation */}
      <ConfirmDialog
        open={showRoleConfirm}
        title="Change User Role?"
        message={
          pendingRoleChange
            ? `Are you sure you want to change ${pendingRoleChange.userName}'s role from "${formatRole(
                pendingRoleChange.currentRole
              )}" to "${formatRole(
                pendingRoleChange.newRole
              )}"?`
            : ''
        }
        confirmText="Change Role"
        cancelText="Cancel"
        onConfirm={handleRoleChange}
        onCancel={() => {
          if (updatingUser) return

          setShowRoleConfirm(false)
          setPendingRoleChange(null)
        }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete User?"
        message={
          pendingDeleteUser
            ? `Are you sure you want to permanently delete ${pendingDeleteUser.userName}? This will remove their account and profile information. This action cannot be undone.`
            : ''
        }
        confirmText={
          deletingUser
            ? 'Deleting...'
            : 'Delete User'
        }
        cancelText="Cancel"
        danger={true}
        onConfirm={handleDeleteUser}
        onCancel={() => {
          if (deletingUser) return

          setShowDeleteConfirm(false)
          setPendingDeleteUser(null)
        }}
      />
    </div>
  )
}