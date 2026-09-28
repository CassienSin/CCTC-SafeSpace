'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

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
    home: (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-7h6v7" />
      </svg>
    ),

    report: (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
        <path d="M8 9h2" />
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

    assistant: (
      <svg {...common}>
        <path d="M12 3a7 7 0 0 0-7 7v3a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3a7 7 0 0 0-7-7Z" />
        <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
        <path d="M9 10h.01M15 10h.01" />
        <path d="M12 3V1" />
      </svg>
    ),

    support: (
      <svg {...common}>
        <path d="M12 21s-7-4.4-7-10.2A4.8 4.8 0 0 1 9.8 6c1 0 1.8.4 2.2 1.1C12.4 6.4 13.2 6 14.2 6A4.8 4.8 0 0 1 19 10.8C19 16.6 12 21 12 21Z" />
        <path d="M8.5 12h1.8l.8-1.5 1.8 3 1-1.5h1.6" />
      </svg>
    ),

    bell: (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
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
  }

  return icons[name] || null
}

export default function MobileNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const [profile, setProfile] = useState(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  async function loadData() {
    try {
      const [profileResponse, notificationResponse] =
        await Promise.all([
          fetch('/api/profile'),
          fetch('/api/notifications/unread'),
        ])

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData.profile)
      }

      if (notificationResponse.ok) {
        const notificationData =
          await notificationResponse.json()

        setUnreadNotifications(
          notificationData.count || 0
        )
      }
    } catch (error) {
      console.error(
        'Failed to load mobile navigation:',
        error
      )
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const role = profile?.role || 'student'

  const items = [
    {
      label: 'Home',
      href: '/dashboard',
      icon: 'home',
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      icon: 'report',
    },
    {
      label: 'Messages',
      href: '/dashboard/messages',
      icon: 'message',
    },
    {
      label: 'Assistant',
      href: '/dashboard/assistant',
      icon: 'assistant',
    },
    {
      label: 'Support',
      href: '/dashboard/support',
      icon: 'support',
      studentOnly: true,
    },
    {
      label: 'Alerts',
      href: '/dashboard/notifications',
      icon: 'bell',
      badge: unreadNotifications,
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: 'user',
    },
  ]

  function isActive(item) {
    if (item.href === '/dashboard') {
      return pathname === '/dashboard'
    }

    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    )
  }

  return (
    <>
      {/* Mobile top header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-white/70 bg-white/85 px-4 shadow-sm backdrop-blur-2xl lg:hidden">

        <button
          type="button"
          onClick={() => router.push('/dashboard/profile')}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img
              src="/school-logo.png"
              alt="School Logo"
              className="h-full w-full object-contain p-1"
            />
          </div>

          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-bold tracking-tight text-slate-900">
              CCTC SafeSpace
            </p>

            <p className="truncate text-[10px] font-medium text-slate-500">
              Student Safety & Support
            </p>
          </div>
        </button>

        <div className="ml-auto flex items-center gap-2">

          <Link
            href="/dashboard/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Icon name="bell" />

            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unreadNotifications > 9
                  ? '9+'
                  : unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm"
          >
            {profile?.full_name
              ? profile.full_name
                  .split(' ')
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'U'}
          </Link>

        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:hidden">

        <div className="mx-auto flex max-w-lg items-center justify-around">

          {items.filter((item) => !item.studentOnly || role === 'student').map((item) => {
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-all ${
                  active
                    ? 'text-blue-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <div
                  className={`relative flex h-8 w-10 items-center justify-center rounded-xl transition-all ${
                    active
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <Icon
                    name={item.icon}
                    className={`h-5 w-5 ${
                      active
                        ? 'stroke-[2.2]'
                        : ''
                    }`}
                  />

                  {item.badge > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {item.badge > 9
                        ? '9+'
                        : item.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-semibold ${
                    active
                      ? 'text-blue-600'
                      : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

        </div>
      </nav>
    </>
  )
}


