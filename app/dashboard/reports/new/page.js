'use client'

import { useEffect, useRef, useState } from 'react'
import {
  EVIDENCE_ACCEPT, MAX_EVIDENCE_FILES, evidenceFormat,
  ensureReportSaved, uploadEvidenceJob,
} from '@/lib/reports/evidenceUpload'
import { handbookCategories } from '@/lib/reports/handbook'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

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
      <path d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function InfoIcon({ className = 'h-5 w-5' }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function LockIcon({ className = 'h-4 w-4' }) {
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
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export default function NewReportPage() {
  const router = useRouter()
  const supabase = createClient()

  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const submittingRef = useRef(false)
  const reportAttemptRef = useRef(null)
  const evidenceJobsRef = useRef([])
  const fileInputRef = useRef(null)
  const [attachments, setAttachments] = useState([])
  const [savedReportId, setSavedReportId] = useState(null)
  const [submissionStarted, setSubmissionStarted] = useState(false)
  const [fileMessage, setFileMessage] = useState('')
  const [submissionMessage, setSubmissionMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const locked = loading || submissionStarted

  useEffect(() => {
    if (!attachments.some((item) => item.status !== 'uploaded')) return
    function warnBeforeLeaving(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [attachments])

  function chooseFiles(event) {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    if (submittingRef.current || reportAttemptRef.current) return
    const problems = []
    const added = []
    for (const file of selected) {
      try {
        evidenceFormat(file)
        if (evidenceJobsRef.current.length + added.length >= MAX_EVIDENCE_FILES) {
          throw new Error('You can attach up to 5 files.')
        }
        const duplicate = [...evidenceJobsRef.current, ...added].some((job) =>
          job.file.name === file.name && job.file.size === file.size
          && job.file.lastModified === file.lastModified)
        if (duplicate) throw new Error('This file is already selected.')
        added.push({ id: crypto.randomUUID(), file, complete: false })
      } catch (error) {
        problems.push(file.name + ': ' + error.message)
      }
    }
    evidenceJobsRef.current = [...evidenceJobsRef.current, ...added]
    setAttachments((current) => [...current, ...added.map((job) => ({
      id: job.id, name: job.file.name, size: job.file.size, status: 'ready', error: '',
    }))])
    setFileMessage(problems.join('\n'))
  }

  function removeFile(id) {
    if (submittingRef.current || reportAttemptRef.current) return
    evidenceJobsRef.current = evidenceJobsRef.current.filter((job) => job.id !== id)
    setAttachments((current) => current.filter((item) => item.id !== id))
    setFileMessage('')
  }

  function setFileStatus(id, status, error = '') {
    setAttachments((current) => current.map((item) => item.id === id ? { ...item, status, error } : item))
  }

  function validateForm() {
    if (!handbookCategories.some((option) => option.value === category)) {
      return 'Please select a report category.'
    }

    if (!title.trim()) {
      return 'Please enter a title.'
    }

    if (!description.trim()) {
      return 'Please describe what happened.'
    }

    return null
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current) return

    if (reportAttemptRef.current) { void submitReport(); return }
    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setShowConfirm(true)
  }

  async function submitReport() {
    if (submittingRef.current) return
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }
    submittingRef.current = true
    setLoading(true)
    setShowConfirm(false)
    setError('')
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Your session expired. Sign back into the same account, then retry here.')

      if (!reportAttemptRef.current) {
        const id = crypto.randomUUID()
        setSubmissionStarted(true)
        reportAttemptRef.current = {
          id, userId: user.id,
          payload: {
            id, reporter_id: user.id, category, title: title.trim(),
            description: description.trim(), location: location.trim() || null,
            incident_date: incidentDate || null, anonymous: false,
            severity: null, ai_category: null, ai_severity: null,
            offense_classification: 'pending', status: 'submitted',
          },
        }
      }
      setSubmissionMessage(savedReportId ? 'Checking your saved report…' : 'Saving your report…')
      const reportId = await ensureReportSaved(supabase, reportAttemptRef.current, user.id)
      setSavedReportId(reportId)

      const jobs = evidenceJobsRef.current
      let failed = 0
      for (let index = 0; index < jobs.length; index++) {
        const job = jobs[index]
        if (job.complete) continue
        setSubmissionMessage('Report saved. Processing attachment ' + (index + 1) + ' of ' + jobs.length + '…')
        try {
          await uploadEvidenceJob(supabase, job, reportId, user.id,
            (status) => setFileStatus(job.id, status))
        } catch (error) {
          failed++
          setFileStatus(job.id, 'failed', error.message || 'Upload failed. Please retry.')
        }
      }
      if (failed) {
        const uploaded = jobs.filter((job) => job.complete).length
        setSubmissionMessage('Report saved. ' + uploaded + ' of ' + jobs.length + ' attachments uploaded.')
        setError('Some attachments could not be saved. Keep this tab open and choose “Retry pending evidence”. Your report will not be submitted again.')
        return
      }
      setSubmissionMessage(jobs.length ? 'Report and all attachments saved.' : 'Report saved.')
      router.replace('/dashboard/reports/' + reportId)
      router.refresh()
    } catch (error) {
      setSubmissionMessage('')
      setError((error.message || 'Unable to complete submission.') +
        (reportAttemptRef.current ? ' Retry in this tab to reuse the same report ID.' : ''))
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <button
          disabled={loading}
          type="button"
          onClick={() =>
            router.push('/dashboard/reports')
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to reports
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ShieldIcon />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Report an Incident
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Tell us what happened. Your report
                will be handled with care and reviewed
                by authorized school personnel.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <LockIcon />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Your safety and privacy matter
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                This report will be linked to your signed-in account.
                School personnel reviewing it will be able to see your identity.
                Include only personal details needed to explain the incident.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {submissionStarted && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              {savedReportId
                ? 'Your report is saved. You can retry unfinished attachments below without creating another report.'
                : 'Submission has started. Details are locked so retrying uses the same report.'}
              {' '}Keep this tab open until uploads finish. Selected files are not retained after closing or reloading.
            </div>
          )}
          {/* Incident information */}
          <Card className="p-5 sm:p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Incident Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Provide the details that will help
                the school understand your concern.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-semibold text-slate-800">
                What happened?
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                id="report-category"
                aria-label="Reported incident category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
                disabled={locked}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 [color-scheme:light]"
              >
                <option value="">Choose a category</option>
                {handbookCategories.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Based on the handbook’s major-offense section (pp. 32–35).
                Choose “Other / Not sure” if none fits. This selection is not a finding of guilt.
                Safety and wellbeing concerns can still be reported without labeling them offenses.
              </p>
            </div>

            {/* Title */}
            <div className="mt-6">
              <label
                htmlFor="title"
                className="text-sm font-semibold text-slate-800"
              >
                Report title
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="title"
                disabled={locked}
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Briefly describe the concern"
                maxLength={150}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-right text-[11px] text-slate-400">
                {title.length}/150
              </p>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label
                htmlFor="description"
                className="text-sm font-semibold text-slate-800"
              >
                What happened?
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <textarea
                id="description"
                disabled={locked}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Describe what happened, when it happened, and anything else you think may be important."
                rows={7}
                maxLength={5000}
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

              <p className="mt-1.5 text-right text-[11px] text-slate-400">
                {description.length}/5000
              </p>
            </div>

            {/* Location + date */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="location"
                  className="text-sm font-semibold text-slate-800"
                >
                  Location
                </label>

                <input
                  id="location"
                disabled={locked}
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  placeholder="Where did it happen?"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="incidentDate"
                  className="text-sm font-semibold text-slate-800"
                >
                  Incident date
                </label>

                <input
                  id="incidentDate"
                disabled={locked}
                  type="date"
                  value={incidentDate}
                  onChange={(event) =>
                    setIncidentDate(
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Evidence <span className="text-sm font-normal text-slate-500">(optional)</span></h2>
                <p id="evidence-help" className="mt-1 text-sm leading-6 text-slate-600">
                  Attach screenshots, photos, documents, or short recordings that help explain the incident.
                  Up to 5 files, 10 MB each. JPG, PNG, WEBP, PDF, MP4, WEBM, MP3, M4A, or WAV.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{attachments.length}/5 files</span>
            </div>
            <input ref={fileInputRef} id="report-evidence" type="file" multiple
              accept={EVIDENCE_ACCEPT} onChange={chooseFiles} disabled={locked}
              aria-describedby="evidence-help" className="sr-only" tabIndex={-1} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={locked || attachments.length >= MAX_EVIDENCE_FILES}
              className="mt-4 min-h-12 w-full rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50">
              Choose evidence files
            </button>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Files upload only when you submit. Avoid unrelated personal information.
              You can submit without evidence and add it later from the report details.
            </p>
            {fileMessage && <p role="alert" className="mt-3 whitespace-pre-line break-words text-sm text-red-700">{fileMessage}</p>}
            {attachments.length > 0 && (
              <ul className="mt-4 space-y-3" aria-label="Selected evidence">
                {attachments.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-600">{(item.size / (1024 * 1024)).toFixed(2)} MB · {{
                        ready: 'Ready to upload', uploading: 'Uploading…', linking: 'Saving attachment details…',
                        uploaded: 'Uploaded', failed: 'Not completed — retry needed',
                      }[item.status]}</p>
                      {item.error && <p className="mt-1 break-words text-xs text-red-700">{item.error}</p>}
                    </div>
                    {!locked && <button type="button" onClick={() => removeFile(item.id)}
                      aria-label={'Remove ' + item.name}
                      className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">What happens next?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your report starts as pending assessment. The Prefect of Discipline and Student
              Discipline Committee determine the applicable classification under the handbook.
              No severity score or sanction is assigned automatically.
            </p>
          </Card>

          {submissionMessage && <p role="status" aria-live="polite" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{submissionMessage}</p>}
          {savedReportId && !loading && (
            <button type="button" onClick={() => router.push('/dashboard/reports/' + savedReportId)}
              className="min-h-11 text-sm font-semibold text-blue-700 underline">
              Open saved report — unfinished attachments will not be carried over
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={() =>
                router.push(
                  '/dashboard/reports'
                )
              }
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? 'Saving report & evidence…'
                : savedReportId ? 'Retry pending evidence'
                : submissionStarted ? 'Retry submission'
                : attachments.length ? 'Submit report & evidence' : 'Submit Report'}
            </Button>
          </div>
        </form>

        {/* Emergency note */}
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <p className="text-xs leading-5 text-amber-800">
            If you are in immediate danger or
            someone needs urgent medical assistance,
            contact emergency services or a trusted
            adult immediately. SafeSpace reports are
            intended for school safety concerns and
            are not a replacement for emergency
            services.
          </p>
        </div>
      </div>

      {/* Confirmation */}
      <ConfirmDialog
        open={showConfirm}
        title="Submit this report?"
        message={'This report is linked to your account and your identity is visible to school personnel reviewing it. ' +
          (attachments.length ? attachments.length + ' attachment(s) will upload after the report is saved. ' : '') +
          'Please check the details before submitting.'}
        confirmText={
          loading
            ? 'Submitting...'
            : 'Submit Report'
        }
        cancelText="Go Back"
        onConfirm={submitReport}
        onCancel={() =>
          setShowConfirm(false)
        }
      />
    </div>
  )
}
