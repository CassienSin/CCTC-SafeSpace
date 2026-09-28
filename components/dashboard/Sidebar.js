'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'
import BrandLogo from '@/components/branding/BrandLogo'

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

    assistant: (
      <svg {...common}>
        <path d="M12 3a7 7 0 0 0-7 7v3a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3a7 7 0 0 0-7-7Z" />
        <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
        <path d="M9 10h.01M15 10h.01" />
        <path d="M12 3V1" />
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

    logout: (
      <svg {...common}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
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

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    try {
      const response = await fetch('/api/profile')

      if (!response.ok) {
        return
      }

      const data = await response.json()
      setProfile(data.profile)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUnreadNotifications() {
    try {
      const response = await fetch('/api/notifications/unread')

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

  useEffect(() => {
    loadProfile()
    loadUnreadNotifications()
  }, [])

  useEffect(() => {
    if (!profile?.id) {
      return
    }

    const channel = supabase
      .channel(`sidebar-notifications-${profile.id}`)
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id])

  async function handleLogout() {
    await supabase.auth.signOut()

    router.push('/login')
    router.refresh()
  }

  const role = profile?.role || 'student'

  const navigation = [
    {
      label: 'Overview',
      href: '/dashboard',
      icon: 'home',
      roles: ['student', 'teacher', 'counselor', 'admin'],
    },
    {
      label: role === 'student' ? 'Report an Incident' : 'Reports',
      href: '/dashboard/reports',
      icon: 'report',
      roles: ['student', 'teacher', 'counselor', 'admin'],
    },
    {
      label: role === 'student' ? 'My Reports' : null,
      href: '/dashboard/reports',
      icon: 'shield',
      roles: [],
    },
    {
      label: 'Messages',
      href: '/dashboard/messages',
      icon: 'message',
      roles: ['student', 'teacher', 'counselor', 'admin'],
    },
    {
      label: 'Assistant',
      href: '/dashboard/assistant',
      icon: 'assistant',
      roles: ['student', 'teacher', 'counselor', 'admin'],
    },
    {
      label: 'Support Resources',
      href: '/dashboard/support',
      icon: 'shield',
      roles: ['student'],
    },
    {
      label: 'Notifications',
      href: '/dashboard/notifications',
      icon: 'bell',
      roles: ['student', 'teacher', 'counselor', 'admin'],
      badge: unreadNotifications,
    },
    {
      label: 'User Management',
      href: '/dashboard/users',
      icon: 'users',
      roles: ['admin'],
    },
    {
      label: 'Profile',
      href: '/dashboard/profile',
      icon: 'user',
      roles: ['student', 'teacher', 'counselor', 'admin'],
    },
  ]

  const visibleNavigation = navigation.filter(
    (item) =>
      item.roles.includes(role) &&
      item.label
  )

  function isActive(item) {
    const isOverview = item.href === '/dashboard'

    return isOverview
      ? pathname === '/dashboard'
      : pathname === item.href ||
          pathname.startsWith(`${item.href}/`)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:flex">
      <div className="flex h-screen w-full flex-col border-r border-white/70 bg-white/85 shadow-[8px_0_40px_rgba(15,23,42,0.06)] backdrop-blur-2xl">

        {/* Brand */}
        <div className="px-5 pb-5 pt-6">
          <BrandLogo />
        </div>

        {/* Small divider */}
        <div className="mx-5 h-px bg-slate-200/70" />

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Navigation
          </p>

          <nav className="space-y-1.5">
            {visibleNavigation.map((item) => {
              const active = isActive(item)

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-900'
                  }`}
                >
                  {/* Active indicator */}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90" />
                  )}

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-white/15 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600'
                    }`}
                  >
                    <Icon name={item.icon} />
                  </span>

                  <span className="min-w-0 flex-1 truncate">
                    {item.label}
                  </span>

                  {item.badge > 0 && (
                    <span
                      className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active
                          ? 'bg-white text-blue-600'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {item.badge > 99
                        ? '99+'
                        : item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Student support section */}
          {role === 'student' && (
            <div className="mt-8">
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Support
              </p>

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Icon name="shield" className="h-5 w-5" />
                </div>

                <p className="mt-3 text-sm font-bold text-slate-800">
                  You are not alone.
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  If something is bothering you, our school support team is here to help.
                </p>

                <Link
                  href="/dashboard/messages"
                  className="mt-3 inline-flex text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Talk to someone →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom user area */}
        <div className="border-t border-slate-200/70 p-4">

          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50/80 p-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
              {profile?.full_name
                ? profile.full_name
                    .split(' ')
                    .map((name) => name[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-800">
                {loading
                  ? 'Loading...'
                  : profile?.full_name || 'User'}
              </p>

              <p className="mt-0.5 truncate text-[11px] font-medium capitalize text-slate-500">
                {role}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-red-100">
              <Icon name="logout" />
            </span>

            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}


