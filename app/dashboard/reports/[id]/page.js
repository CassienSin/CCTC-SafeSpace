'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/client'

import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

function ArrowLeftIcon({ className = 'h-4 w-4' }) {
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
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
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

function FileIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  )
}

function UploadIcon({ className = 'h-5 w-5' }) {
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
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function ShieldIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
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
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  )
}

function LocationIcon({ className = 'h-5 w-5' }) {
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
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

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
      <path d="M4 21c.7-4 3.3-6 8-6s7.3 2 8 6" />
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

function EyeIcon({ className = 'h-4 w-4' }) {
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function formatDate(date) {
  if (!date) {
    return 'Not provided'
  }

  return new Date(date).toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  )
}

function formatLabel(value) {
  if (!value) {
    return 'Not provided'
  }

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    )
}

function formatFileSize(bytes) {
  if (!bytes) {
    return 'Unknown size'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyle(
        status
      )}`}
    >
      {formatLabel(status)}
    </span>
  )
}

function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${severityStyle(
        severity
      )}`}
    >
      {formatLabel(severity)}
    </span>
  )
}

function aiReviewRequired(report) {
  return (
    ['self_harm', 'threat', 'violence'].includes(report.ai_category) ||
    ['high', 'critical'].includes(report.ai_severity)
  )
}

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

export default function ReportDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [report, setReport] = useState(null)
  const [evidence, setEvidence] = useState([])

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState('')
  const [uploadMessage, setUploadMessage] =
    useState('')

  const [role, setRole] = useState(null)

  // Report status
  const [updatingStatus, setUpdatingStatus] =
    useState(false)

  const [statusMessage, setStatusMessage] =
    useState('')

  const [showStatusConfirm, setShowStatusConfirm] =
    useState(false)

  const [pendingStatus, setPendingStatus] =
    useState(null)

  const [selectedStatus, setSelectedStatus] =
    useState('')

  // Evidence deletion
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false)

  const [
    pendingDeleteEvidence,
    setPendingDeleteEvidence,
  ] = useState(null)

  // Report deletion
  const [
    deletingReport,
    setDeletingReport,
  ] = useState(false)

  const [
    showReportDeleteConfirm,
    setShowReportDeleteConfirm,
  ] = useState(false)

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    setLoading(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
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

      const isStaff = [
        'teacher',
        'counselor',
        'admin',
      ].includes(profile.role)

      let query = supabase
        .from('reports')
        .select('*')
        .eq('id', params.id)

      // Students can only access their own reports.
      if (!isStaff) {
        query = query.eq(
          'reporter_id',
          user.id
        )
      }

      const { data, error } =
        await query.single()

      if (error) {
        setError(
          'Report not found or you do not have access to it.'
        )
        return
      }

      setReport(data)
      setSelectedStatus(data.status)

      await loadEvidence()
    } catch (err) {
      console.error(
        'Failed to load report:',
        err
      )

      setError(
        err.message ||
          'Unable to load this report.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadEvidence() {
    const { data, error } =
      await supabase
        .from('report_evidence')
        .select('*')
        .eq('report_id', params.id)
        .order('created_at', {
          ascending: false,
        })

    if (!error) {
      setEvidence(data || [])
    }
  }

  // ==============================
  // REPORT STATUS
  // ==============================

  function requestStatusChange(newStatus) {
    if (!report) {
      return
    }

    if (report.status === newStatus) {
      setSelectedStatus(report.status)
      return
    }

    setPendingStatus(newStatus)
    setShowStatusConfirm(true)
  }

  async function updateStatus() {
    if (!report || !pendingStatus) {
      return
    }

    setUpdatingStatus(true)
    setStatusMessage('')
    setError('')

    const { error } = await supabase
      .from('reports')
      .update({
        status: pendingStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id)

    if (error) {
      setError(error.message)

      setSelectedStatus(report.status)

      setUpdatingStatus(false)
      setShowStatusConfirm(false)
      setPendingStatus(null)

      return
    }

    setReport((currentReport) => ({
      ...currentReport,
      status: pendingStatus,
    }))

    setSelectedStatus(pendingStatus)

    setStatusMessage(
      'Report status updated successfully.'
    )

    setUpdatingStatus(false)
    setShowStatusConfirm(false)
    setPendingStatus(null)
  }

  // ==============================
  // EVIDENCE UPLOAD
  // ==============================

  async function handleUpload(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setUploading(true)
    setUploadMessage('')
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('You are not logged in.')
      setUploading(false)
      return
    }

    const filePath = `${user.id}/${params.id}/${Date.now()}-${file.name}`

    const { error: uploadError } =
      await supabase.storage
        .from('evidence')
        .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { error: databaseError } =
      await supabase
        .from('report_evidence')
        .insert({
          report_id: params.id,
          uploaded_by: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })

    if (databaseError) {
      await supabase.storage
        .from('evidence')
        .remove([filePath])

      setError(databaseError.message)
      setUploading(false)
      return
    }

    setUploadMessage(
      'Evidence uploaded successfully.'
    )

    await loadEvidence()

    setUploading(false)

    event.target.value = ''
  }

  // ==============================
  // DELETE EVIDENCE
  // ==============================

  function requestDeleteEvidence(
    evidenceItem
  ) {
    setPendingDeleteEvidence(evidenceItem)
    setShowDeleteConfirm(true)
  }

  async function deleteEvidence() {
    if (!pendingDeleteEvidence) {
      return
    }

    setError('')

    const { error: storageError } =
      await supabase.storage
        .from('evidence')
        .remove([
          pendingDeleteEvidence.file_path,
        ])

    if (storageError) {
      setError(storageError.message)
      return
    }

    const { error: databaseError } =
      await supabase
        .from('report_evidence')
        .delete()
        .eq(
          'id',
          pendingDeleteEvidence.id
        )

    if (databaseError) {
      setError(databaseError.message)
      return
    }

    setShowDeleteConfirm(false)
    setPendingDeleteEvidence(null)

    await loadEvidence()
  }

  // ==============================
  // DELETE REPORT
  // ==============================

  async function deleteReport() {
    if (!report) {
      return
    }

    setDeletingReport(true)
    setError('')

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', report.id)

    if (error) {
      setError(error.message)
      setDeletingReport(false)
      return
    }

    setShowReportDeleteConfirm(false)
    setDeletingReport(false)

    router.push('/dashboard/reports')
  }

  // ==============================
  // VIEW EVIDENCE
  // ==============================

  async function handleView(
    evidenceItem
  ) {
    setError('')

    const { data, error } =
      await supabase.storage
        .from('evidence')
        .createSignedUrl(
          evidenceItem.file_path,
          60
        )

    if (error) {
      setError(error.message)
      return
    }

    window.open(
      data.signedUrl,
      '_blank'
    )
  }

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="h-4 w-32 rounded bg-slate-200" />

            <div className="mt-6 rounded-2xl bg-white/80 p-6 sm:p-8">
              <div className="h-8 w-2/3 max-w-md rounded bg-slate-200" />

              <div className="mt-3 h-4 w-48 rounded bg-slate-100" />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-20 rounded-xl bg-slate-100"
                    />
                  )
                )}
              </div>

              <div className="mt-8 h-32 rounded-xl bg-slate-100" />

              <div className="mt-8 h-40 rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==============================
  // ERROR
  // ==============================

  if (error && !report) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeftIcon />
            Back to Reports
          </Link>

          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    )
  }

  const isStaff = [
    'teacher',
    'counselor',
    'admin',
  ].includes(role)

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon />
          Back to Reports
        </Link>

        {/* Messages */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {uploadMessage && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            {uploadMessage}
          </div>
        )}

        {statusMessage && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            {statusMessage}
          </div>
        )}

        {/* Main report */}
        <Card className="mt-6 overflow-hidden">

          {/* Header */}
          <div className="border-b border-slate-100 bg-white/80 p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                  <ShieldIcon className="h-5 w-5" />
                  Incident Report
                </div>

                <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {report.title}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Submitted on{' '}
                  {formatDate(report.created_at)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <SeverityBadge
                  severity={report.severity}
                />

                {isStaff && report.ai_severity && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                    AI: {formatLabel(report.ai_severity)}
                  </span>
                )}

                <StatusBadge
                  status={report.status}
                />
              </div>
            </div>
          </div>

          {/* Report information */}
          <div className="p-5 sm:p-7 lg:p-8">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Report Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Details associated with this incident report.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoItem
                icon={
                  <ShieldIcon className="h-4 w-4" />
                }
                label="Category"
                value={formatLabel(
                  report.category
                )}
              />

              <InfoItem
                icon={
                  <ShieldIcon className="h-4 w-4" />
                }
                label="Severity"
                value={formatLabel(
                  report.severity
                )}
              />

              <InfoItem
                icon={
                  <CalendarIcon className="h-4 w-4" />
                }
                label="Incident Date"
                value={formatDate(
                  report.incident_date
                )}
              />

              <InfoItem
                icon={
                  <CalendarIcon className="h-4 w-4" />
                }
                label="Submitted"
                value={formatDate(
                  report.created_at
                )}
              />

              <InfoItem
                icon={
                  <LocationIcon className="h-4 w-4" />
                }
                label="Location"
                value={
                  report.location ||
                  'Not provided'
                }
              />

              <InfoItem
                icon={
                  <UserIcon className="h-4 w-4" />
                }
                label="Anonymous Report"
                value={
                  report.anonymous
                    ? 'Yes'
                    : 'No'
                }
              />
            </div>

            {isStaff && (report.ai_category || report.ai_severity) && (
              <div className={`mt-6 rounded-2xl border p-5 ${
                aiReviewRequired(report)
                  ? 'border-red-200 bg-red-50'
                  : 'border-indigo-100 bg-indigo-50/70'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    aiReviewRequired(report)
                      ? 'bg-red-100 text-red-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 3 5 6v5c0 4.8 2.9 8.5 7 10 4.1-1.5 7-5.2 7-10V6l-7-3Z" />
                      <path d="M9 12h6M12 9v6" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-sm font-bold ${
                        aiReviewRequired(report) ? 'text-red-900' : 'text-indigo-900'
                      }`}>
                        AI assessment
                      </h2>

                      {aiReviewRequired(report) && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                          Human review required
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {report.ai_category && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI category</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatLabel(report.ai_category)}</p>
                        </div>
                      )}

                      {report.ai_severity && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI severity</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatLabel(report.ai_severity)}</p>
                        </div>
                      )}
                    </div>

                    <p className={`mt-3 text-xs leading-5 ${
                      aiReviewRequired(report) ? 'text-red-800' : 'text-indigo-800'
                    }`}>
                      This is an automated recommendation based on the report text. Authorized staff must review the incident and make the final decision.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Staff reporter notice */}
            {isStaff && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <UserIcon />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Reporter Information
                    </p>

                    <p className="mt-1 text-sm leading-6 text-blue-700">
                      {report.anonymous
                        ? 'This report was submitted anonymously. The reporter identity is not displayed.'
                        : 'Student reporter information is available to authorized staff.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-8 border-t border-slate-100 pt-8">
              <h2 className="text-lg font-bold text-slate-900">
                Description
              </h2>

              <div className="mt-4 rounded-2xl bg-slate-50/80 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {report.description}
                </p>
              </div>
            </div>

            {/* Evidence */}
            <div className="mt-8 border-t border-slate-100 pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Evidence
                    </h2>

                    {evidence.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {evidence.length}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Screenshots, images, or documents related to this report.
                  </p>
                </div>

                {!isStaff && (
                  <label
                    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      uploading
                        ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <UploadIcon className="h-4 w-4" />

                    {uploading
                      ? 'Uploading...'
                      : 'Upload Evidence'}

                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {evidence.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                    <FileIcon />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    No evidence uploaded
                  </p>

                  <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
                    {isStaff
                      ? 'No evidence has been attached to this report.'
                      : 'You can attach screenshots, images, or documents that may help support your report.'}
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FileIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.file_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatFileSize(
                              item.file_size
                            )}{' '}
                            ·{' '}
                            {formatDate(
                              item.created_at
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex w-full gap-2 sm:w-auto">
                        <button
                          type="button"
                          onClick={() =>
                            handleView(item)
                          }
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
                        >
                          <EyeIcon />
                          View
                        </button>

                        {!isStaff && (
                          <button
                            type="button"
                            onClick={() =>
                              requestDeleteEvidence(
                                item
                              )
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:flex-none"
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report status */}
            <div className="mt-8 border-t border-slate-100 pt-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Report Status
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {isStaff
                    ? 'Authorized staff can update the current status of this report.'
                    : 'Track the progress of your incident report here.'}
                </p>
              </div>

              {isStaff ? (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Update Status
                  </label>

                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      requestStatusChange(
                        event.target.value
                      )
                    }
                    disabled={updatingStatus}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
                  >
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

                  {updatingStatus && (
                    <p className="mt-3 text-sm text-slate-500">
                      Updating status...
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <ShieldIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">
                          Current Status
                        </p>

                        <StatusBadge
                          status={report.status}
                        />
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Your report can be tracked from this page. You will also receive a notification when the report status changes.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Student report actions */}
            {!isStaff && (
              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Report Actions
                      </p>

                      <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                        Deleting this report permanently removes the report and its associated information.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowReportDeleteConfirm(
                          true
                        )
                      }
                      disabled={deletingReport}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrashIcon />
                      {deletingReport
                        ? 'Deleting...'
                        : 'Delete Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* STATUS CONFIRMATION */}
      <ConfirmDialog
        open={showStatusConfirm}
        title="Change Report Status?"
        message={
          pendingStatus
            ? `Are you sure you want to change the report status to "${formatLabel(
                pendingStatus
              )}"?`
            : ''
        }
        confirmText="Change Status"
        cancelText="Cancel"
        onConfirm={updateStatus}
        onCancel={() => {
          setShowStatusConfirm(false)
          setPendingStatus(null)
          setSelectedStatus(
            report?.status || ''
          )
        }}
      />

      {/* EVIDENCE DELETE CONFIRMATION */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Evidence?"
        message={
          pendingDeleteEvidence
            ? `Are you sure you want to delete "${pendingDeleteEvidence.file_name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Evidence"
        cancelText="Cancel"
        danger={true}
        onConfirm={deleteEvidence}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setPendingDeleteEvidence(null)
        }}
      />

      {/* REPORT DELETE CONFIRMATION */}
      <ConfirmDialog
        open={showReportDeleteConfirm}
        title="Delete Report?"
        message="Are you sure you want to permanently delete this incident report? This action cannot be undone."
        confirmText="Delete Report"
        cancelText="Cancel"
        danger={true}
        onConfirm={deleteReport}
        onCancel={() => {
          setShowReportDeleteConfirm(false)
        }}
      />
    </div>
  )
}
