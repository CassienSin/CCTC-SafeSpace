'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { classificationLabel, classificationOptions } from '@/lib/reports/handbook'

export function ClassificationBadge({ value }) {
  return (
    <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-inset ring-indigo-200">
      {classificationLabel(value)}
    </span>
  )
}

export default function HandbookAssessment({ report, role, onSaved }) {
  const [classification, setClassification] = useState(report.offense_classification || 'pending')
  const [note, setNote] = useState(report.classification_note || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const busy = useRef(false)
  // No discipline-specific role exists yet. Limit the new decision field to admins.
  const canReview = role === 'admin'

  async function save(event) {
    event.preventDefault()
    if (!canReview || busy.current) return
    busy.current = true
    setSaving(true)
    setMessage('')
    try {
      const supabase = createClient()
      // Conditional update prevents overwriting another review made since loading.
      let query = supabase.from('reports').update({
        offense_classification: classification,
        classification_note: note.trim() || null,
      }).eq('id', report.id)
      query = report.classified_at
        ? query.eq('classified_at', report.classified_at)
        : query.is('classified_at', null)
      const { data, error } = await query.select('*').maybeSingle()
      if (error) throw error
      if (!data) throw new Error('This report changed or you no longer have access. Reload before reviewing it again.')
      onSaved(data)
      setMessage('Classification saved. This does not impose a sanction or determine guilt.')
    } catch (error) {
      setMessage(error.message || 'Unable to save the classification.')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
      <h2 className="text-base font-bold text-slate-900">Handbook assessment</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        The selected incident category is a report, not a finding of guilt. The Prefect of Discipline
        and Student Discipline Committee determine the classification under the handbook.
        Sanctions require a separate decision and due process.
      </p>
      <div className="mt-3"><ClassificationBadge value={report.offense_classification} /></div>
      {report.classification_note && (
        <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">{report.classification_note}</p>
      )}
      {report.classified_at && <p className="mt-2 text-xs text-slate-600">Last recorded: {new Date(report.classified_at).toLocaleString()}</p>}
      {canReview && (
        <form onSubmit={save} className="mt-5 space-y-3">
          <p className="text-xs leading-5 text-slate-600">Admin: record the authorized discipline review only. This note is visible to the reporter. Do not include confidential internal information.</p>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="offense-classification">Classification</label>
          <select id="offense-classification" value={classification} disabled={saving}
            onChange={(event) => setClassification(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900">
            {classificationOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="classification-note">Review explanation / handbook reference</label>
          <textarea id="classification-note" value={note} required maxLength={2000} rows={3} disabled={saving}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900" />
          <button disabled={saving || !note.trim()} className="rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save reviewed classification'}
          </button>
        </form>
      )}
      {message && <p role="status" className="mt-3 text-sm text-slate-800">{message}</p>}
    </section>
  )
}
