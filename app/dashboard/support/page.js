'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SupportResourcesPage() {
  const router = useRouter()
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let active = true

    async function checkStudentAccess() {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()

        if (!active) return

        if (!response.ok || data.profile?.role !== 'student') {
          router.replace('/dashboard')
          return
        }

        setAllowed(true)
      } catch {
        router.replace('/dashboard')
      } finally {
        if (active) setCheckingAccess(false)
      }
    }

    checkStudentAccess()

    return () => {
      active = false
    }
  }, [router])

  if (checkingAccess || !allowed) {
    return <div className="min-h-screen bg-slate-50" />
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center text-4xl text-slate-900">♡</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Support Resources</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            You&apos;re not alone. Access mental-health support, guidance contacts, and anti-bullying resources.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border-2 border-red-400 bg-white/90 p-5 shadow-lg shadow-red-100/50 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">📞</span>
            <h2 className="text-lg font-extrabold text-slate-900">Emergency Contacts</h2>
          </div>
          <p className="mt-3 text-sm text-slate-700">If you&apos;re in immediate danger, contact emergency help now.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href="tel:2345" className="rounded-2xl bg-slate-100 p-4 transition hover:bg-slate-200">
              <p className="font-bold text-slate-900">Campus Security</p>
              <p className="mt-1 text-sm text-slate-700">Local: 2345</p>
              <p className="text-sm text-slate-700">Mobile: 0917-123-4567</p>
            </a>
            <a href="tel:911" className="rounded-2xl bg-slate-100 p-4 transition hover:bg-slate-200">
              <p className="font-bold text-slate-900">National Emergency Hotline</p>
              <p className="mt-1 text-sm text-slate-700">911</p>
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-red-700">Replace these sample contact details with verified CCTC emergency information before deployment.</p>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-200/50">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">👥</span>
              <h2 className="text-lg font-extrabold text-slate-900">CCTC Guidance Office</h2>
            </div>
            <p className="mt-3 text-sm text-slate-600">Our trained counselors are available to provide support, guidance, and intervention.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-bold text-slate-900">Ms. Maria Santos</p>
                <p className="text-sm text-slate-600">Head Guidance Counselor</p>
                <a href="tel:3456" className="mt-3 block text-sm text-slate-700 hover:text-blue-600">📞 Local 3456</a>
                <a href="mailto:m.santos@cctc.edu" className="mt-1 block break-all text-sm text-slate-700 hover:text-blue-600">✉ m.santos@cctc.edu</a>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-bold text-slate-900">Mr. Roberto Reyes</p>
                <p className="text-sm text-slate-600">Guidance Counselor</p>
                <a href="tel:3457" className="mt-3 block text-sm text-slate-700 hover:text-blue-600">📞 Local 3457</a>
                <a href="mailto:r.reyes@cctc.edu" className="mt-1 block break-all text-sm text-slate-700 hover:text-blue-600">✉ r.reyes@cctc.edu</a>
              </div>
            </div>
          </div>

          <div className="bg-violet-300 px-5 py-4 text-sm text-slate-900 sm:px-6">
            <p><strong>Office Hours:</strong> Monday – Friday, 8:00 AM – 5:00 PM</p>
            <p className="mt-1"><strong>Location:</strong> Student Services Building, 2nd Floor</p>
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/reports/new" className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">Report an Incident</Link>
          <Link href="/dashboard/messages" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50">Message Support</Link>
        </div>
      </div>
    </main>
  )
}
