'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'

function Icon({
  name,
  className = 'h-5 w-5',
}) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
  }

  const icons = {
    bell: (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    ),

    message: (
      <svg {...common}>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.4 9.4 0 0 1-4-.9L3 21l1.9-4.4A8.3 8.3 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
      </svg>
    ),

    report: (
      <svg {...common}>
        <path d="M4 4h16v16H4z" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),

    check: (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    ),

    checkAll: (
      <svg {...common}>
        <path d="m3 12 4 4L17 6" />
        <path d="m9 16 2 2 9-9" />
      </svg>
    ),

    inbox: (
      <svg {...common}>
        <path d="M4 4h16v16H4z" />
        <path d="M4 14h4l2 3h4l2-3h4" />
      </svg>
    ),

    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),

    info: (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </svg>
    ),
  }

  return icons[name] || null
}

const notificationTypes = {
  message: {
    icon: 'message',
    label: 'Message',
    iconClass: 'bg-violet-100 text-violet-600',
  },

  report_status: {
    icon: 'report',
    label: 'Report Update',
    iconClass: 'bg-blue-100 text-blue-600',
  },

  default: {
    icon: 'bell',
    label: 'Notification',
    iconClass: 'bg-slate-100 text-slate-600',
  },
}

function getNotificationType(type) {
  return notificationTypes[type] || notificationTypes.default
}

function getNotificationDestination(notification) {
  if (
    notification.type === 'report_status' &&
    notification.report_id
  ) {
    return {
      label: 'View Report',
      href:
        '/dashboard/reports/' +
        notification.report_id,
    }
  }

  if (
    notification.type === 'message' &&
    notification.conversation_id
  ) {
    return {
      label: 'Open Conversation',
      href:
        '/dashboard/messages/' +
        notification.conversation_id,
    }
  }

  return null
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()

  const difference =
    now.getTime() - date.getTime()

  const seconds = Math.floor(
    difference / 1000
  )

  const minutes = Math.floor(
    seconds / 60
  )

  const hours = Math.floor(
    minutes / 60
  )

  const days = Math.floor(
    hours / 24
  )

  if (seconds < 30) {
    return 'Just now'
  }

  if (minutes < 1) {
    return seconds + 's ago'
  }

  if (minutes < 60) {
    return minutes + 'm ago'
  }

  if (hours < 24) {
    return hours + 'h ago'
  }

  if (days === 1) {
    return 'Yesterday'
  }

  if (days < 7) {
    return days + 'd ago'
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFullDate(dateString) {
  return new Date(dateString).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function NotificationSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="animate-pulse p-5 sm:p-6"
        >
          <div className="flex gap-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200" />

            <div className="min-w-0 flex-1">
              <div className="h-4 w-40 rounded bg-slate-200" />

              <div className="mt-3 h-3 w-full max-w-xl rounded bg-slate-200" />

              <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />

              <div className="mt-4 h-3 w-24 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()

  const [supabase] = useState(() =>
    createClient()
  )

  const [notifications, setNotifications] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [filter, setFilter] =
    useState('all')

  const [processingId, setProcessingId] =
    useState(null)

  const [markingAll, setMarkingAll] =
    useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('notifications-page-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification =
            payload.new

          setNotifications((current) => {
            if (
              current.some(
                (notification) =>
                  notification.id ===
                  newNotification.id
              )
            ) {
              return current
            }

            return [
              newNotification,
              ...current,
            ]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updatedNotification =
            payload.new

          setNotifications((current) =>
            current.map((notification) =>
              notification.id ===
              updatedNotification.id
                ? {
                    ...notification,
                    ...updatedNotification,
                  }
                : notification
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  async function loadNotifications() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        '/api/notifications'
      )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Failed to load notifications.'
        )

        setLoading(false)
        return
      }

      setNotifications(
        data.notifications || []
      )
    } catch {
      setError(
        'Something went wrong while loading notifications.'
      )
    }

    setLoading(false)
  }

  async function markAsRead(id) {
    setProcessingId(id)
    setError('')

    try {
      const response = await fetch(
        '/api/notifications/' + id,
        {
          method: 'PATCH',
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        setError(
          data.error ||
            'Failed to mark notification as read.'
        )

        return false
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read_at:
                  data.notification.read_at,
              }
            : notification
        )
      )

      return true
    } catch {
      setError(
        'Something went wrong while updating the notification.'
      )

      return false
    } finally {
      setProcessingId(null)
    }
  }

  async function markAllAsRead() {
    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.read_at
      )

    if (
      unreadNotifications.length === 0
    ) {
      return
    }

    setMarkingAll(true)
    setError('')

    try {
      const results =
        await Promise.all(
          unreadNotifications.map(
            (notification) =>
              fetch(
                '/api/notifications/' +
                  notification.id,
                {
                  method: 'PATCH',
                }
              )
          )
        )

      const failed = results.some(
        (response) => !response.ok
      )

      if (failed) {
        setError(
          'Some notifications could not be marked as read.'
        )
      }

      const now =
        new Date().toISOString()

      setNotifications((current) =>
        current.map((notification) =>
          notification.read_at
            ? notification
            : {
                ...notification,
                read_at: now,
              }
        )
      )
    } catch {
      setError(
        'Something went wrong while updating your notifications.'
      )
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleNotificationClick(
    notification
  ) {
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }

    const destination =
      getNotificationDestination(
        notification
      )

    if (destination) {
      router.push(destination.href)
    }
  }

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read_at
      ).length,
    [notifications]
  )

  const filteredNotifications =
    useMemo(() => {
      if (filter === 'unread') {
        return notifications.filter(
          (notification) =>
            !notification.read_at
        )
      }

      return notifications
    }, [notifications, filter])

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl">

        {/* HEADER */}

        <div className="mb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Icon
                    name="bell"
                    className="h-6 w-6"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Notifications
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Stay updated with your SafeSpace account.
                  </p>
                </div>

              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon
                  name="checkAll"
                  className="h-4 w-4"
                />

                {markingAll
                  ? 'Marking as read...'
                  : 'Mark all as read'}
              </button>
            )}

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <div className="mt-0.5 shrink-0">
              <Icon
                name="info"
                className="h-5 w-5"
              />
            </div>

            <div className="flex-1">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 text-red-600">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">

          <Card className="p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Total notifications
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {notifications.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon
                  name="inbox"
                  className="h-5 w-5"
                />
              </div>

            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Unread
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {unreadCount}
                </p>
              </div>

              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon
                  name="bell"
                  className="h-5 w-5"
                />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99
                      ? '99+'
                      : unreadCount}
                  </span>
                )}
              </div>

            </div>
          </Card>

        </div>

        {/* NOTIFICATION CENTER */}

        <Card className="overflow-hidden">

          <div className="border-b border-slate-100 bg-white/80 px-4 py-4 sm:px-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Notification Center
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Your latest SafeSpace activity
                </p>
              </div>

              <div className="flex rounded-xl bg-slate-100 p-1">

                <button
                  type="button"
                  onClick={() =>
                    setFilter('all')
                  }
                  className={
                    'rounded-lg px-4 py-2 text-xs font-bold transition ' +
                    (filter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800')
                  }
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilter('unread')
                  }
                  className={
                    'rounded-lg px-4 py-2 text-xs font-bold transition ' +
                    (filter === 'unread'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800')
                  }
                >
                  Unread

                  {unreadCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">
                      {unreadCount}
                    </span>
                  )}
                </button>

              </div>

            </div>

          </div>

          {loading ? (
            <NotificationSkeleton />
          ) : filteredNotifications.length ===
            0 ? (

            <div className="px-6 py-16 text-center sm:py-20">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

                <Icon
                  name={
                    filter === 'unread'
                      ? 'check'
                      : 'bell'
                  }
                  className="h-7 w-7"
                />

              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {filter === 'unread'
                  ? 'You’re all caught up'
                  : 'No notifications yet'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {filter === 'unread'
                  ? 'You have no unread notifications right now. New activity will appear here automatically.'
                  : 'Notifications about your reports, messages, and SafeSpace activity will appear here.'}
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {filteredNotifications.map(
                (notification) => {
                  const isUnread =
                    !notification.read_at

                  const type =
                    getNotificationType(
                      notification.type
                    )

                  const destination =
                    getNotificationDestination(
                      notification
                    )

                  const isClickable =
                    Boolean(destination)

                  return (
                    <div
                      key={notification.id}
                      onClick={() =>
                        isClickable &&
                        handleNotificationClick(
                          notification
                        )
                      }
                      className={
                        'group relative p-5 transition sm:p-6 ' +
                        (isUnread
                          ? 'bg-blue-50/45'
                          : 'bg-white') +
                        (isClickable
                          ? ' cursor-pointer hover:bg-slate-50'
                          : '')
                      }
                    >

                      {isUnread && (
                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600" />
                      )}

                      <div className="flex gap-4">

                        <div
                          className={
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' +
                            type.iconClass
                          }
                        >
                          <Icon
                            name={type.icon}
                            className="h-5 w-5"
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <h3
                                  className={
                                    'text-sm sm:text-base ' +
                                    (isUnread
                                      ? 'font-bold text-slate-900'
                                      : 'font-semibold text-slate-800')
                                  }
                                >
                                  {notification.title}
                                </h3>

                                {isUnread && (
                                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    New
                                  </span>
                                )}

                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2">

                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  {type.label}
                                </span>

                                <span className="text-slate-300">
                                  •
                                </span>

                                <span
                                  title={formatFullDate(
                                    notification.created_at
                                  )}
                                  className="text-xs text-slate-400"
                                >
                                  {formatRelativeTime(
                                    notification.created_at
                                  )}
                                </span>

                              </div>

                            </div>

                            {isUnread && (
                              <span className="hidden h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 sm:block" />
                            )}

                          </div>

                          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                            {notification.message}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-2">

                            {destination && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()

                                  handleNotificationClick(
                                    notification
                                  )
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-blue-100 hover:text-blue-700"
                              >
                                {destination.label}

                                <Icon
                                  name="arrow"
                                  className="h-3.5 w-3.5"
                                />
                              </button>
                            )}

                            {isUnread && (
                              <button
                                type="button"
                                disabled={
                                  processingId ===
                                  notification.id
                                }
                                onClick={(event) => {
                                  event.stopPropagation()

                                  markAsRead(
                                    notification.id
                                  )
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Icon
                                  name="check"
                                  className="h-3.5 w-3.5"
                                />

                                {processingId ===
                                notification.id
                                  ? 'Updating...'
                                  : 'Mark as read'}
                              </button>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  )
                }
              )}

            </div>
          )}

        </Card>

        {/* FOOTER */}

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 backdrop-blur-sm">

          <div className="mt-0.5 shrink-0 text-slate-400">
            <Icon
              name="info"
              className="h-4 w-4"
            />
          </div>

          <p className="text-xs leading-5 text-slate-500">
            Notifications are updated automatically.
            Report status changes and new messages will
            appear here in real time.
          </p>

        </div>

      </div>
    </div>
  )
}

