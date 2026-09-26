'use client'

import { useState } from 'react'
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

const categories = [
  {
    value: 'bullying',
    label: 'Bullying',
    description:
      'Repeated teasing, intimidation, exclusion, or other bullying behavior.',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description:
      'Unwanted behavior, comments, or conduct that causes distress.',
  },
  {
    value: 'threat',
    label: 'Threat',
    description:
      'Threats of harm, intimidation, or behavior that makes you feel unsafe.',
  },
  {
    value: 'violence',
    label: 'Violence',
    description:
      'Physical violence, assault, fighting, or physical harm.',
  },
  {
    value: 'self_harm',
    label: 'Self-Harm',
    description:
      'A concern involving self-harm or possible risk of self-harm.',
  },
  {
    value: 'cyberbullying',
    label: 'Cyberbullying',
    description:
      'Bullying, harassment, or intimidation through online platforms.',
  },
  {
    value: 'discrimination',
    label: 'Discrimination',
    description:
      'Unfair or harmful treatment based on a protected or personal characteristic.',
  },
  {
    value: 'other',
    label: 'Other',
    description:
      'A safety concern that does not fit another category.',
  },
]

const severityOptions = [
  {
    value: 'low',
    label: 'Low',
    description:
      'A concern that does not appear immediately dangerous.',
  },
  {
    value: 'medium',
    label: 'Medium',
    description:
      'A significant concern that should be reviewed.',
  },
  {
    value: 'high',
    label: 'High',
    description:
      'A serious concern requiring prompt attention.',
  },
  {
    value: 'critical',
    label: 'Critical',
    description:
      'An immediate or potentially life-threatening concern.',
  },
]

export default function NewReportPage() {
  const router = useRouter()
  const supabase = createClient()

  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [anonymous, setAnonymous] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  function validateForm() {
    if (!category) {
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

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setShowConfirm(true)
  }

  async function submitReport() {
    try {
      setLoading(true)
      setShowConfirm(false)
      setError('')

      // --------------------------------------------------
      // Get authenticated user
      // --------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      // --------------------------------------------------
      // AI classification + severity assessment
      // --------------------------------------------------

      const aiText = `${title.trim()}\n${description.trim()}`

      let classification = null

      try {
        const aiResponse = await fetch(
          '/api/ai/classify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: aiText,
            }),
          }
        )

        const aiData = await aiResponse.json()

        if (!aiResponse.ok) {
          throw new Error(
            aiData.error ||
              'AI classification failed.'
          )
        }

        classification = aiData

        console.log(
          'AI classification:',
          classification
        )
      } catch (aiError) {
        console.error(
          'AI classification failed:',
          aiError
        )

        // The report should still be submitted
        // if the AI service is temporarily unavailable.
        classification = null
      }

      // --------------------------------------------------
      // Save report to Supabase
      // --------------------------------------------------

      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,

          // Student-selected category
          category,

          title: title.trim(),

          description: description.trim(),

          location:
            location.trim() || null,

          incident_date:
            incidentDate || null,

          // Student-selected/current severity
          severity,

          anonymous,

          // AI-generated category
          ai_category:
            classification?.category || null,

          // AI-generated severity
          ai_severity:
            classification?.severity || null,
        })

      if (insertError) {
        throw insertError
      }

      // --------------------------------------------------
      // Finish
      // --------------------------------------------------

      router.push('/dashboard/reports')
      router.refresh()
    } catch (err) {
      console.error(
        'Failed to submit report:',
        err
      )

      setError(
        err.message ||
          'Unable to submit your report. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:min-h-screen lg:p-8">
      <div className="mx-auto max-w-4xl">

        {/* Back */}
        <button
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
                Only authorized school personnel
                can access submitted reports. You
                can also choose to submit this report
                anonymously.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
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

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {categories.map(
                  (option) => {
                    const selected =
                      category === option.value

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setCategory(
                            option.value
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/10'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-slate-300'
                            }`}
                          >
                            {selected && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {option.label}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  }
                )}
              </div>
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

          {/* Severity */}
          <Card className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                Severity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the option that best represents
                the seriousness of the situation.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {severityOptions.map(
                (option) => {
                  const selected =
                    severity === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setSeverity(
                          option.value
                        )
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/10'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-slate-300'
                          }`}
                        >
                          {selected && (
                            <div className="h-2 w-2 rounded-full bg-white" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-bold capitalize text-slate-800">
                            {option.label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                }
              )}
            </div>
          </Card>

          {/* Anonymous */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() =>
                  setAnonymous(
                    !anonymous
                  )
                }
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
                  anonymous
                    ? 'bg-blue-600'
                    : 'bg-slate-300'
                }`}
                aria-pressed={anonymous}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    anonymous
                      ? 'left-6'
                      : 'left-1'
                  }`}
                />
              </button>

              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  Submit anonymously
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your identity will not be
                  displayed to staff viewing the
                  report. Your account is still
                  securely associated with the
                  report internally.
                </p>
              </div>
            </div>
          </Card>

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
              {loading
                ? 'Analyzing & Submitting...'
                : 'Submit Report'}
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
        title={
          anonymous
            ? 'Submit anonymous report?'
            : 'Submit this report?'
        }
        message={
          anonymous
            ? 'Your report will be submitted anonymously. Authorized staff will be able to review the incident, but your identity will not be displayed to them.'
            : 'Please make sure the information you provided is accurate. Once submitted, authorized school personnel will be able to review your report.'
        }
        confirmText={
          loading
            ? 'Analyzing & Submitting...'
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