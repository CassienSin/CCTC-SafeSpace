'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function PlusIcon({ className = 'h-5 w-5' }) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function ClipboardIcon({ className = 'h-6 w-6' }) {
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
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <path d="M9 18h3" />
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

function ArrowRightIcon({ className = 'h-4 w-4' }) {
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
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function FilterIcon({ className = 'h-5 w-5' }) {
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
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  )
}

function formatText(value) {
  if (!value) return '—'

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
}

function formatDate(date) {
  if (!date) return '—'

  return new Date(date).toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  )
}

function severityStyle(severity) {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 text-red-700 ring-red-600/15'
    case 'high':
      return 'bg-orange-50 text-orange-700 ring-orange-600/15'
    case 'medium':
      return 'bg-amber-50 text-amber-700 ring-amber-600/15'
    case 'low':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-500/10'
  }
}

function statusStyle(status) {
  switch (status) {
    case 'submitted':
      return 'bg-blue-50 text-blue-700 ring-blue-600/15'
    case 'under_review':
      return 'bg-violet-50 text-violet-700 ring-violet-600/15'
    case 'investigating':
      return 'bg-orange-50 text-orange-700 ring-orange-600/15'
    case 'resolved':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'
    case 'closed':
      return 'bg-slate-100 text-slate-600 ring-slate-500/10'
    default:
      return 'bg-slate-100 text-slate-600 ring-slate-500/10'
  }
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle(
        status
      )}`}
    >
      {formatText(status)}
    </span>
  )
}

function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${severityStyle(
        severity
      )}`}
    >
      {formatText(severity)}
    </span>
  )
}

function aiReviewRequired(report) {
  const category = report.ai_category
  const severity = report.ai_severity

  return (
    ['self_harm', 'threat', 'violence'].includes(category) ||
    ['high', 'critical'].includes(severity)
  )
}

function AiBadge({ report }) {
  if (!report.ai_category && !report.ai_severity) {
    return null
  }

  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
      AI assessed
    </span>
  )
}

export default function ReportsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState(null)

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [severityFilter, setSeverityFilter] =
    useState('all')

  const [search, setSearch] = useState('')

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setError('Unable to load your profile.')
        return
      }

      setRole(profile.role)

      let query = supabase
        .from('reports')
        .select(`
          id,
          title,
          category,
          severity,
          ai_category,
          ai_severity,
          status,
          location,
          incident_date,
          anonymous,
          created_at,
          reporter_id,
          profiles (
            full_name,
            email,
            student_id
          )
        `)
        .order('created_at', {
          ascending: false,
        })

      // Students can only see their own reports.
      if (profile.role === 'student') {
        query = query.eq('reporter_id', user.id)
      }

      // Staff can see all reports.
      else if (
        !['teacher', 'counselor', 'admin'].includes(
          profile.role
        )
      ) {
        router.push('/dashboard')
        return
      }

      const { data, error: reportsError } =
        await query

      if (reportsError) {
        throw reportsError
      }

      setReports(data || [])
    } catch (err) {
      console.error('Failed to load reports:', err)

      setError(
        err.message || 'Unable to load reports.'
      )
    } finally {
      setLoading(false)
    }
  }

  const isStaff = [
    'teacher',
    'counselor',
    'admin',
  ].includes(role)

  const filteredReports = reports.filter(
    (report) => {
      const matchesStatus =
        !isStaff ||
        statusFilter === 'all' ||
        report.status === statusFilter

      const matchesSeverity =
        !isStaff ||
        severityFilter === 'all' ||
        (report.ai_severity || report.severity) === severityFilter

      const query = search.trim().toLowerCase()

      const matchesSearch =
        !query ||
        report.title?.toLowerCase().includes(query) ||
        report.category?.toLowerCase().includes(query) ||
        report.location?.toLowerCase().includes(query) ||
        (
          isStaff &&
          !report.anonymous &&
          report.profiles?.full_name
            ?.toLowerCase()
            .includes(query)
        )

      return (
        matchesStatus &&
        matchesSeverity &&
        matchesSearch
      )
    }
  )

  const prioritizedReports = [...filteredReports].sort((a, b) => {
    if (!isStaff) return 0

    const severityRank = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    }

    const aSeverity = severityRank[a.ai_severity || a.severity] || 0
    const bSeverity = severityRank[b.ai_severity || b.severity] || 0
    const aReview = aiReviewRequired(a) ? 1 : 0
    const bReview = aiReviewRequired(b) ? 1 : 0

    return bReview - aReview || bSeverity - aSeverity
  })

  const priorityCount = reports.filter(aiReviewRequired).length
  const totalReports = reports.length

  const openReports = reports.filter(
    (report) =>
      !['resolved', 'closed'].includes(
        report.status
      )
  ).length

  const resolvedReports = reports.filter(
    (report) => report.status === 'resolved'
  ).length

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-72 max-w-full rounded bg-slate-100" />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-white/80"
                />
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-2xl bg-white/80"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <ClipboardIcon />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {isStaff
                    ? 'Incident Reports'
                    : 'My Reports'}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {isStaff
                    ? 'Review and manage submitted student incident reports.'
                    : 'View and track the incident reports you have submitted.'}
                </p>
              </div>
            </div>
          </div>

          {/* Always available to students */}
          {!isStaff && (
            <Link
              href="/dashboard/reports/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Report an Incident
            </Link>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadReports}
              className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-900"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm font-medium text-slate-500">
              {isStaff ? 'Total Reports' : 'My Reports'}
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {totalReports}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              All submitted reports
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium text-slate-500">
              In Progress
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-blue-600">
              {openReports}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Awaiting completion
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium text-slate-500">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
              {resolvedReports}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Reports marked resolved
            </p>
          </Card>
        </div>

        {isStaff && priorityCount > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              !
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">
                {priorityCount} report{priorityCount === 1 ? '' : 's'} need human review
              </p>
              <p className="mt-1 text-xs leading-5 text-red-700">
                The AI detected a high-risk category or severity. Review these reports first, then make the final determination yourself.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6 p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-slate-400" />

              <h2 className="text-sm font-bold text-slate-800">
                {isStaff
                  ? 'Filter Reports'
                  : 'Find a Report'}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative sm:col-span-2 lg:col-span-2">
                <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder={
                    isStaff
                      ? 'Search title, category, location, reporter...'
                      : 'Search your reports...'
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {isStaff && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    aria-label="Filter by status"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="all">
                      All Statuses
                    </option>
                    <option value="submitted">
                      Submitted
                    </option>
                    <option value="under_review">
                      Under Review
                    </option>
                    <option value="investigating">
                      Investigating
                    </option>
                    <option value="resolved">
                      Resolved
                    </option>
                    <option value="closed">
                      Closed
                    </option>
                  </select>

                  <select
                    value={severityFilter}
                    onChange={(event) =>
                      setSeverityFilter(event.target.value)
                    }
                    aria-label="Filter by severity"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="all">
                      All Severities
                    </option>
                    <option value="critical">
                      Critical
                    </option>
                    <option value="high">
                      High
                    </option>
                    <option value="medium">
                      Medium
                    </option>
                    <option value="low">
                      Low
                    </option>
                  </select>
                </>
              )}
            </div>

            {isStaff && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Showing{' '}
                  <span className="font-semibold text-slate-700">
                    {filteredReports.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-700">
                    {totalReports}
                  </span>{' '}
                  reports
                </p>

                {(statusFilter !== 'all' ||
                  severityFilter !== 'all' ||
                  search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all')
                      setSeverityFilter('all')
                      setSearch('')
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Reports list */}
        {filteredReports.length === 0 ? (
          <Card className="px-6 py-14 text-center sm:py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ClipboardIcon className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {reports.length === 0
                ? isStaff
                  ? 'No reports yet'
                  : 'No reports yet'
                : 'No matching reports'}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {reports.length === 0
                ? isStaff
                  ? 'There are currently no incident reports to review.'
                  : 'You have not submitted any incident reports yet. When you do, you can track their status here.'
                : 'Try adjusting your search or filters to find the report you are looking for.'}
            </p>

            {!isStaff && (
              <Link
                href="/dashboard/reports/new"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Report an Incident
              </Link>
            )}

            {isStaff &&
              reports.length > 0 && (
                <Button
                  variant="secondary"
                  className="mt-6"
                  onClick={() => {
                    setStatusFilter('all')
                    setSeverityFilter('all')
                    setSearch('')
                  }}
                >
                  Clear filters
                </Button>
              )}
          </Card>
        ) : (
          <div className="space-y-4">
            {prioritizedReports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="group block"
              >
                <Card className="p-4 transition duration-200 hover:border-blue-200 hover:bg-white hover:shadow-md sm:p-5 lg:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    {/* Report information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-base font-bold text-slate-900 transition group-hover:text-blue-700 sm:text-lg">
                          {report.title}
                        </h2>

                        <SeverityBadge
                          severity={report.ai_severity || report.severity}
                        />

                        <StatusBadge
                          status={report.status}
                        />

                        {isStaff && <AiBadge report={report} />}

                        {isStaff && aiReviewRequired(report) && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/15">
                            Human review
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Category
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatText(report.ai_category || report.category)}
                          </p>

                          {isStaff && report.ai_category && (
                            <p className="mt-1 text-[11px] text-indigo-600">
                              AI classification
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Location
                          </p>

                          <p className="mt-1 break-words text-sm font-medium text-slate-700">
                            {report.location || 'Not provided'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Incident Date
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(report.incident_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Submitted
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(report.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Staff-only reporter information */}
                      {isStaff && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-xs text-slate-500">
                            Reporter:{' '}
                            <span className="font-semibold text-slate-700">
                              {report.anonymous
                                ? 'Anonymous'
                                : report.profiles?.full_name ||
                                  'Unknown'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* View action */}
                    <div className="flex shrink-0 items-center justify-between border-t border-slate-100 pt-3 sm:border-0 sm:pt-1">
                      <span className="text-xs text-slate-400 sm:hidden">
                        View report details
                      </span>

                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition group-hover:gap-3">
                        View Report
                        <ArrowRightIcon />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom action for students */}
        {!isStaff && filteredReports.length > 0 && (
          <div className="mt-6 flex justify-center sm:justify-end">
            <Link
              href="/dashboard/reports/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white/90 px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 sm:w-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Submit Another Report
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
