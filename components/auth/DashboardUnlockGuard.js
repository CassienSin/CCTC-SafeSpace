'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const UNLOCK_TTL_MS = 15 * 60 * 1000

export default function DashboardUnlockGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (pathname.startsWith('/auth/')) return

    function enforceUnlock() {
      const lastUnlock = Number(sessionStorage.getItem('cctc_unlock_at') || 0)
      const stillUnlocked =
        lastUnlock > 0 && Date.now() - lastUnlock < UNLOCK_TTL_MS

      if (!stillUnlocked) {
        router.replace(`/auth/unlock?next=${encodeURIComponent(pathname)}`)
      }
    }

    enforceUnlock()
    window.addEventListener('pageshow', enforceUnlock)
    window.addEventListener('focus', enforceUnlock)

    return () => {
      window.removeEventListener('pageshow', enforceUnlock)
      window.removeEventListener('focus', enforceUnlock)
    }
  }, [pathname, router])

  return null
}
