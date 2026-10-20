export const MAX_EVIDENCE_FILES = 5
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024

const formats = {
  jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'],
  webp: ['image/webp'], pdf: ['application/pdf'],
  mp4: ['video/mp4'], webm: ['video/webm'],
  mp3: ['audio/mpeg', 'audio/mp3'],
  m4a: ['audio/mp4', 'audio/x-m4a'],
  wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],
}
export const EVIDENCE_ACCEPT = Object.keys(formats).map((ext) => `.${ext}`).join(',')

export function evidenceFormat(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  const allowed = formats[extension]
  if (!allowed || (file.type && !allowed.includes(file.type.toLowerCase()))) {
    throw new Error('Use JPG, PNG, WEBP, PDF, MP4, WEBM, MP3, M4A, or WAV files.')
  }
  if (!file.size) throw new Error('Empty files cannot be attached.')
  if (file.size > MAX_EVIDENCE_BYTES) throw new Error('Each attachment must be 10 MB or smaller.')
  return { extension, contentType: allowed[0] }
}

// Stable client-generated ID is reused if an insert response is lost.
export async function ensureReportSaved(supabase, attempt, userId) {
  if (attempt.userId !== userId) throw new Error('Sign back into the account that started this report before retrying.')
  async function lookup() {
    const { data, error } = await supabase.from('reports').select('id, reporter_id')
      .eq('id', attempt.id).eq('reporter_id', userId).maybeSingle()
    if (error) throw error
    return data
  }
  if (await lookup()) { attempt.saved = true; return attempt.id }
  if (attempt.saved) throw new Error('The saved report is no longer available. Open Reports to check its status.')
  const { error } = await supabase.from('reports').insert(attempt.payload)
  if (!error) { attempt.saved = true; return attempt.id }
  // A timeout can occur after the server committed. Verify before retrying.
  if (await lookup()) { attempt.saved = true; return attempt.id }
  throw new Error(error.message || 'Could not save the report. Retry here to reuse the same report ID.')
}

async function findEvidence(supabase, job, reportId, userId) {
  const { data, error } = await supabase.from('report_evidence').select('id')
    .eq('report_id', reportId).eq('uploaded_by', userId)
    .eq('file_path', job.path).maybeSingle()
  if (error) throw error
  return data
}

// Jobs live in a ref, so successful stages survive a retry in this tab.
// Never delete an object after an ambiguous metadata failure: it might already
// be referenced by a committed evidence row whose response was lost.
export async function uploadEvidenceJob(supabase, job, reportId, userId, onStatus) {
  if (job.complete) return
  const { extension, contentType } = evidenceFormat(job.file)
  const expectedPath = `${userId}/${reportId}/${job.id}.${extension}`
  if (job.path && job.path !== expectedPath) throw new Error('The attachment belongs to a different report or account.')
  job.path = expectedPath
  if (await findEvidence(supabase, job, reportId, userId)) {
    job.complete = true
    onStatus('uploaded')
    return
  }
  if (!job.storageSaved) {
    onStatus('uploading')
    const wasAttempted = job.storageAttempted === true
    job.storageAttempted = true
    const { error } = await supabase.storage.from('evidence').upload(job.path, job.file, {
      contentType, upsert: false,
    })
    // On retry only, a conflict at our UUID path can mean the previous upload
    // succeeded but its response was lost. Do not overwrite existing evidence.
    if (error && !(wasAttempted && String(error.statusCode) === '409')) throw error
    job.storageSaved = true
  }
  onStatus('linking')
  const { error } = await supabase.from('report_evidence').insert({
    report_id: reportId, uploaded_by: userId, file_name: job.file.name,
    file_path: job.path, file_type: contentType, file_size: job.file.size,
  })
  if (error && !(await findEvidence(supabase, job, reportId, userId))) throw error
  job.complete = true
  onStatus('uploaded')
}
