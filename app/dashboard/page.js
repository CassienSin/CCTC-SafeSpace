'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'

function Icon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 24 24',
  }

  const icons = {
    report: (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
        <path d="M8 9h2" />
      </svg>
    ),

    shield: (
      <svg {...common}>
        <path d="M12 3 20 6v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),

    message: (
      <svg {...common}>
        <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.5-3.3A7.4 7.4 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
        <path d="M8 11h.01" />
        <path d="M12 11h.01" />
        <path d="M16 11h.01" />
      </svg>
    ),

    bell: (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    ),

    users: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),

    user: (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),

    plus: (
      <svg {...common}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),

    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),

    settings: (
      <svg {...common}>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.5 1.5-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.12v-.4a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.5-1.5.06-.06A1.7 1.7 0 0 0 9.2 15a1.7 1.7 0 0 0-1.56-1.03H7.2v-2.12h.44A1.7 1.7 0 0 0 9.2 10.8a1.7 1.7 0 0 0-.34-1.88L8.8 8.86l1.5-1.5.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56V5.8h2.12v.4a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.5 1.5-.06.06A1.7 1.7 0 0 0 19.4 10c.17.6.73 1.03 1.36 1.03h.44v2.12h-.44A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    ),
  }

  return icons[name] || null
}

export default function DashboardPage() {
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [reports, setReports] = useState([])
  const [reportCount, setReportCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (!profile?.id) {
      return
    }

    const messageChannel = supabase
      .channel(`dashboard-messages-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadUnreadMessages()
        }
      )

    const notificationChannel = supabase
      .channel(`dashboard-notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadUnreadNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadUnreadNotifications()
        }
      )

    messageChannel.subscribe()
    notificationChannel.subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(notificationChannel)
    }
  }, [profile?.id])

  async function loadDashboard() {
    try {
      const profileResponse = await fetch('/api/profile')

      if (!profileResponse.ok) {
        return
      }

      const profileData = await profileResponse.json()

      setProfile(profileData.profile)

      await Promise.all([
        loadReports(profileData.profile),
        loadUnreadMessages(),
        loadUnreadNotifications(),
      ])
    } catch (error) {
      console.error(
        'Failed to load dashboard:',
        error
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadReports(currentProfile) {
    try {
      let query = supabase
        .from('reports')
        .select(
          'id, title, category, severity, status, location, incident_date, created_at, anonymous, reporter_id'
        )
        .order('created_at', {
          ascending: false,
        })
        .limit(5)

      if (currentProfile?.role === 'student') {
        query = query.eq(
          'reporter_id',
          currentProfile.id
        )
      }

      const {
        data,
        error,
      } = await query

      if (error) {
        console.error(
          'Failed to load reports:',
          error
        )
        return
      }

      setReports(data || [])

      let countQuery = supabase
        .from('reports')
        .select('id', {
          count: 'exact',
          head: true,
        })

      if (currentProfile?.role === 'student') {
        countQuery = countQuery.eq(
          'reporter_id',
          currentProfile.id
        )
      }

      const {
        count,
        error: countError,
      } = await countQuery

      if (!countError) {
        setReportCount(count || 0)
      }
    } catch (error) {
      console.error(
        'Failed to load report data:',
        error
      )
    }
  }

  async function loadUnreadMessages() {
    try {
      const response = await fetch(
        '/api/messages/unread'
      )

      if (!response.ok) {
        return
      }

      const data = await response.json()

      setUnreadMessages(data.count || 0)
    } catch (error) {
      console.error(
        'Failed to load unread messages:',
        error
      )
    }
  }

  async function loadUnreadNotifications() {
    try {
      const response = await fetch(
        '/api/notifications/unread'
      )

      if (!response.ok) {
        return
      }

      const data = await response.json()

      setUnreadNotifications(data.count || 0)
    } catch (error) {
      console.error(
        'Failed to load unread notifications:',
        error
      )
    }
  }

  function formatDate(date) {
    if (!date) {
      return '—'
    }

    return new Date(date).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
  }

  function formatCategory(category) {
    if (!category) {
      return 'Other'
    }

    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  function formatStatus(status) {
    if (!status) {
      return 'Submitted'
    }

    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      )
  }

  function getSeverityStyle(severity) {
    const styles = {
      low: 'bg-emerald-50 text-emerald-700',
      medium: 'bg-amber-50 text-amber-700',
      high: 'bg-orange-50 text-orange-700',
      critical: 'bg-red-50 text-red-700',
    }

    return (
      styles[severity] ||
      'bg-slate-100 text-slate-600'
    )
  }

  function getStatusStyle(status) {
    const styles = {
      submitted:
        'bg-blue-50 text-blue-700',
      under_review:
        'bg-violet-50 text-violet-700',
      investigating:
        'bg-amber-50 text-amber-700',
      resolved:
        'bg-emerald-50 text-emerald-700',
      closed:
        'bg-slate-100 text-slate-600',
    }

    return (
      styles[status] ||
      'bg-slate-100 text-slate-600'
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          <div className="mb-8">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-9 w-72 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <Card
                  key={index}
                  className="h-36 animate-pulse"
                />
              )
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="h-96 animate-pulse lg:col-span-2" />
            <Card className="h-96 animate-pulse" />
          </div>

        </div>
      </div>
    )
  }

  const role = profile?.role || 'student'
  const firstName =
    profile?.full_name?.split(' ')[0] ||
    'there'

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <header className="mb-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Welcome back
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Hello, {firstName}.
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                {role === 'student'
                  ? 'Your SafeSpace dashboard is here to help you report concerns, stay informed, and reach support when you need it.'
                  : role === 'admin'
                    ? 'Monitor the SafeSpace platform, review reports, and manage your users.'
                    : 'Review student concerns, manage reports, and stay connected with the school community.'}
              </p>
            </div>

            {role === 'student' && (
              <Link
                href="/dashboard/reports/new"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <Icon
                  name="plus"
                  className="h-4 w-4"
                />
                Report an Incident
              </Link>
            )}

          </div>

        </header>

        {role === 'student' && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <Link
                href="/dashboard/reports"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        My Reports
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {reportCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Submitted by you
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon
                        name="report"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Link
                href="/dashboard/messages"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Messages
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {unreadMessages}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Unread conversations
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Icon
                        name="message"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Link
                href="/dashboard/notifications"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Notifications
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {unreadNotifications}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Need your attention
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Icon
                        name="bell"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Link
                href="/dashboard/messages"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        SafeSpace
                      </p>

                      <p className="mt-2 text-xl font-bold text-slate-900">
                        Support
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Talk to someone
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon
                        name="shield"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">

              <Card className="overflow-hidden lg:col-span-2">

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      My Recent Reports
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Your latest submitted concerns
                    </p>
                  </div>

                  <Link
                    href="/dashboard/reports"
                    className="rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                  >
                    View all →
                  </Link>

                </div>

                <ReportList
                  reports={reports}
                  emptyText="You haven't submitted any reports yet."
                  showCreate
                  formatDate={formatDate}
                  formatCategory={formatCategory}
                  getSeverityStyle={getSeverityStyle}
                  getStatusStyle={getStatusStyle}
                  formatStatus={formatStatus}
                />

              </Card>

              <Card className="overflow-hidden">

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Icon
                      name="shield"
                      className="h-6 w-6"
                    />
                  </div>

                  <h2 className="mt-5 text-xl font-bold">
                    You're Not Alone
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    If something is bothering you,
                    you don't have to handle it by
                    yourself. Our support team is
                    here to listen and help.
                  </p>

                </div>

                <div className="p-6">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon
                        name="check"
                        className="h-5 w-5"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Need someone to talk to?
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Connect with a teacher or counselor through secure messaging.
                      </p>
                    </div>

                  </div>

                  <Link
                    href="/dashboard/messages/new"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Start a conversation
                  </Link>

                </div>

              </Card>

            </section>

            <QuickActions
              actions={[
                {
                  href: '/dashboard/reports/new',
                  icon: 'plus',
                  title: 'Report an Incident',
                  description:
                    'Tell us what happened and get the support you need.',
                  label: 'Create report →',
                  color: 'blue',
                },
                {
                  href: '/dashboard/messages',
                  icon: 'message',
                  title: 'Messages',
                  description:
                    'Talk privately with a teacher or counselor.',
                  label: 'Open messages →',
                  color: 'violet',
                },
                {
                  href: '/dashboard/notifications',
                  icon: 'bell',
                  title: 'Notifications',
                  description:
                    'Stay updated on your reports and conversations.',
                  label: 'View notifications →',
                  color: 'amber',
                },
                {
                  href: '/dashboard/profile',
                  icon: 'user',
                  title: 'My Profile',
                  description:
                    'View and manage your SafeSpace account.',
                  label: 'Open profile →',
                  color: 'emerald',
                },
              ]}
            />
          </>
        )}

        {(role === 'teacher' ||
          role === 'counselor') && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <Link
                href="/dashboard/reports"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Incident Reports
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {reportCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Reports in the system
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon
                        name="report"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Link
                href="/dashboard/messages"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Messages
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {unreadMessages}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Unread conversations
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Icon
                        name="message"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Link
                href="/dashboard/notifications"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Notifications
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {unreadNotifications}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Need your attention
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Icon
                        name="bell"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Card className="h-full p-5">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Student Safety
                    </p>

                    <p className="mt-2 text-xl font-bold text-slate-900">
                      Support
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Help students when needed
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon
                      name="shield"
                      className="h-6 w-6"
                    />
                  </div>

                </div>

              </Card>

            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">

              <Card className="overflow-hidden lg:col-span-2">

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Recent Reports
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Latest student concerns
                    </p>
                  </div>

                  <Link
                    href="/dashboard/reports"
                    className="rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                  >
                    View all →
                  </Link>

                </div>

                <ReportList
                  reports={reports}
                  emptyText="There are currently no reports to review."
                  formatDate={formatDate}
                  formatCategory={formatCategory}
                  getSeverityStyle={getSeverityStyle}
                  getStatusStyle={getStatusStyle}
                  formatStatus={formatStatus}
                />

              </Card>

              <Card className="p-6">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Icon
                    name="shield"
                    className="h-6 w-6"
                  />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  Student Support
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Review incoming reports, communicate with students, and provide appropriate support.
                </p>

                <Link
                  href="/dashboard/messages"
                  className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Open Messages →
                </Link>

              </Card>

            </section>

            <QuickActions
              actions={[
                {
                  href: '/dashboard/reports',
                  icon: 'report',
                  title: 'Incident Reports',
                  description:
                    'Review and manage submitted reports.',
                  label: 'Open reports →',
                  color: 'blue',
                },
                {
                  href: '/dashboard/messages',
                  icon: 'message',
                  title: 'Messages',
                  description:
                    'Communicate securely with students.',
                  label: 'Open messages →',
                  color: 'violet',
                },
                {
                  href: '/dashboard/notifications',
                  icon: 'bell',
                  title: 'Notifications',
                  description:
                    'Review important system updates.',
                  label: 'View notifications →',
                  color: 'amber',
                },
                {
                  href: '/dashboard/profile',
                  icon: 'user',
                  title: 'My Profile',
                  description:
                    'View and manage your account.',
                  label: 'Open profile →',
                  color: 'emerald',
                },
              ]}
            />
          </>
        )}

        {role === 'admin' && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <Link
                href="/dashboard/reports"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Total Reports
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {reportCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        All submitted reports
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon
                        name="report"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Link
                href="/dashboard/messages"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        Messages
                      </p>

                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {unreadMessages}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Unread conversations
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <Icon
                        name="message"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

              <Link
                href="/dashboard/users"
                className="group"
              >
                <Card className="h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-semibold text-slate-500">
                        User Management
                      </p>

                      <p className="mt-2 text-xl font-bold text-slate-900">
                        Manage
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Accounts and roles
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Icon
                        name="users"
                        className="h-6 w-6"
                      />
                    </div>

                  </div>

                </Card>
              </Link>

            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">

              <Card className="overflow-hidden lg:col-span-2">

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Recent Reports
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Latest system activity
                    </p>
                  </div>

                  <Link
                    href="/dashboard/reports"
                    className="rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                  >
                    View all →
                  </Link>

                </div>

                <ReportList
                  reports={reports}
                  emptyText="There are currently no reports in the system."
                  formatDate={formatDate}
                  formatCategory={formatCategory}
                  getSeverityStyle={getSeverityStyle}
                  getStatusStyle={getStatusStyle}
                  formatStatus={formatStatus}
                />

              </Card>

              <Card className="p-6">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon
                    name="settings"
                    className="h-6 w-6"
                  />
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-900">
                  System Management
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Manage users, review system activity,
                  and oversee the SafeSpace platform.
                </p>

                <Link
                  href="/dashboard/users"
                  className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Manage Users →
                </Link>

              </Card>

            </section>

            <QuickActions
              actions={[
                {
                  href: '/dashboard/reports',
                  icon: 'report',
                  title: 'Reports',
                  description:
                    'Review and oversee incident reports.',
                  label: 'Open reports →',
                  color: 'blue',
                },
                {
                  href: '/dashboard/users',
                  icon: 'users',
                  title: 'User Management',
                  description:
                    'Manage accounts and user roles.',
                  label: 'Manage users →',
                  color: 'emerald',
                },
                {
                  href: '/dashboard/messages',
                  icon: 'message',
                  title: 'Messages',
                  description:
                    'Access system conversations.',
                  label: 'Open messages →',
                  color: 'violet',
                },
                {
                  href: '/dashboard/notifications',
                  icon: 'bell',
                  title: 'Notifications',
                  description:
                    'Review system notifications.',
                  label: 'View notifications →',
                  color: 'amber',
                },
              ]}
            />
          </>
        )}

        <footer className="py-8 text-center">
          <p className="text-xs text-slate-400">
            CCTC SafeSpace • Student Safety & Support
          </p>
        </footer>

      </div>
    </div>
  )
}

/* =========================================================
   REPORT LIST
========================================================= */

function ReportList({
  reports,
  emptyText,
  showCreate = false,
  formatDate,
  formatCategory,
  getSeverityStyle,
  getStatusStyle,
  formatStatus,
}) {
  if (reports.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon
            name="report"
            className="h-7 w-7"
          />
        </div>

        <h3 className="mt-4 text-base font-bold text-slate-800">
          No reports yet
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          {emptyText}
        </p>

        {showCreate && (
          <Link
            href="/dashboard/reports/new"
            className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Report an Incident
          </Link>
        )}

      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">

      {reports.map((report) => (
        <Link
          key={report.id}
          href={`/dashboard/reports/${report.id}`}
          className="group block px-5 py-5 transition hover:bg-slate-50/80 sm:px-6"
        >

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${getSeverityStyle(
                    report.severity
                  )}`}
                >
                  {report.severity}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(
                    report.status
                  )}`}
                >
                  {formatStatus(report.status)}
                </span>

              </div>

              <h3 className="mt-2 truncate text-sm font-bold text-slate-800 group-hover:text-blue-600">
                {report.title}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {formatCategory(report.category)}

                {report.location
                  ? ` • ${report.location}`
                  : ''}
              </p>

            </div>

            <div className="shrink-0 text-left sm:text-right">

              <p className="text-xs font-medium text-slate-400">
                {formatDate(report.created_at)}
              </p>

              <p className="mt-1 text-xs font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
                View report →
              </p>

            </div>

          </div>

        </Link>
      ))}

    </div>
  )
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

function QuickActions({ actions }) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      hover: 'group-hover:border-blue-200',
    },

    violet: {
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      hover: 'group-hover:border-violet-200',
    },

    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      hover: 'group-hover:border-amber-200',
    },

    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      hover: 'group-hover:border-emerald-200',
    },
  }

  return (
    <section className="mt-6">

      <div className="mb-4">

        <h2 className="text-lg font-bold text-slate-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Get where you need to go quickly.
        </p>

      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {actions.map((action) => {

          const colors =
            colorClasses[action.color] ||
            colorClasses.blue

          return (
            <Link
              key={action.href}
              href={action.href}
              className="group"
            >

              <Card
                className={`h-full p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg ${colors.hover}`}
              >

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}
                >
                  <Icon
                    name={action.icon}
                    className="h-5 w-5"
                  />
                </div>

                <h3 className="mt-4 font-bold text-slate-900">
                  {action.title}
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {action.description}
                </p>

                <span
                  className={`mt-4 inline-block text-xs font-bold ${colors.text}`}
                >
                  {action.label}
                </span>

              </Card>

            </Link>
          )
        })}

      </div>
    </section>
  )
}