// Server decisions only. No client-provided score, embedding, or success flag.
export const MODEL = 'human-3.3.6-faceres-wasm-v1'
export const MATCH_OPTIONS = { order: 2, multiplier: 25, min: 0.2, max: 0.8 }
export const MATCH_THRESHOLD = 0.62
// A lower continuity bar accommodates the planned head turns during setup.
// Final login matching still uses MATCH_THRESHOLD and identityDecision().
export const CONTINUITY_THRESHOLD = 0.55
// Geometry is a continuity fallback when head turns lower embedding similarity.
export const STRUCTURE_THRESHOLD = 0.68
export const AVERAGE_THRESHOLD = 0.64
export const LIVE_THRESHOLD = 0.6
export const MATCHES_REQUIRED = 4
// Legacy name/state field retained: one shared budget for pose AND liveness.
export const MAX_POSE_RETRIES = 4

export class FaceError extends Error {
  constructor(message, status = 400) { super(message); this.status = status }
}
export function validEmbedding(value) {
  return Array.isArray(value) && value.length === 1024 && value.every(Number.isFinite)
    && value.some(n => n !== 0)
}
export function identityDecision(scores) {
  return Array.isArray(scores) && scores.length === 5 && scores.every(Number.isFinite)
    && scores.filter(n => n >= MATCH_THRESHOLD).length >= MATCHES_REQUIRED
    && scores.reduce((a,b) => a+b, 0)/5 >= AVERAGE_THRESHOLD
}
const distance = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1])
const STRUCTURE_POINTS = [1, 10, 33, 61, 133, 152, 168, 234, 263, 291, 362, 454]
export function faceStructure(mesh) {
  if (!Array.isArray(mesh) || mesh.length < 455
    || STRUCTURE_POINTS.some(index => !Array.isArray(mesh[index]) || mesh[index].length < 3
      || !mesh[index].slice(0,3).every(Number.isFinite))) {
    throw new FaceError('Face landmarks could not be checked. Try again.')
  }
  const leftEye = mesh[33], rightEye = mesh[263]
  const scale = Math.hypot(leftEye[0]-rightEye[0], leftEye[1]-rightEye[1], leftEye[2]-rightEye[2])
  if (!Number.isFinite(scale) || scale < 1e-5) throw new FaceError('Face landmarks could not be checked. Try again.')
  // Pairwise 3D distances remove camera position and size while retaining
  // relative facial structure.
  const features = []
  for (let i = 0; i < STRUCTURE_POINTS.length; i++) {
    for (let j = i + 1; j < STRUCTURE_POINTS.length; j++) {
      const a = mesh[STRUCTURE_POINTS[i]], b = mesh[STRUCTURE_POINTS[j]]
      features.push(Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]) / scale)
    }
  }
  return features.every(Number.isFinite) ? features : null
}
export function structureSimilarity(a, b) {
  if (!Array.isArray(a) || a.length !== 66 || !Array.isArray(b) || b.length !== 66
    || !a.every(Number.isFinite) || !b.every(Number.isFinite)) return 0
  // Head turns and expressions move landmarks. Count broad agreement across
  // the whole structure rather than requiring every distance to match.
  const agrees = a.reduce((count, value, index) => {
    const other = b[index]
    const relativeDifference = Math.abs(value-other) / Math.max(0.12, value, other)
    return count + (relativeDifference <= 0.32 ? 1 : 0)
  }, 0)
  return agrees / a.length
}
export function eyeRatio(mesh) {
  if (!Array.isArray(mesh) || mesh.length < 388) throw new FaceError('Face landmarks could not be checked. Try again.')
  const eye = (a,b,c,d,e,f) => (distance(mesh[b],mesh[f])+distance(mesh[c],mesh[e])) / (2*distance(mesh[a],mesh[d]))
  const value = (eye(33,160,158,133,153,144)+eye(362,385,387,263,373,380))/2
  if (!Number.isFinite(value)) throw new FaceError('Face landmarks could not be checked. Try again.')
  return value
}
export function hasBlink(ratios) {
  // Require an open -> closed -> open sequence, not merely a closed-eye photo.
  const baseline = Math.max(...ratios)
  if (!Number.isFinite(baseline) || baseline < 0.2) return false
  let open = false, closed = false
  for (const ratio of ratios) {
    if (!open && ratio >= baseline*0.85) open = true
    else if (open && !closed && ratio < Math.min(0.2, baseline*0.65)) closed = true
    else if (closed && ratio >= baseline*0.85) return true
  }
  return false
}
export function poseMatches(prompt, face) {
  const yaw = face.rotation?.angle?.yaw
  const pitch = face.rotation?.angle?.pitch
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch) || Math.abs(pitch)>0.45) return false
  // Human's positive yaw corresponds to the person's own LEFT shoulder.
  // The selfie preview is mirrored for display; captured frames are not.
  if (prompt === 'left') return yaw > 0.12 && yaw < 0.65
  if (prompt === 'right') return yaw < -0.12 && yaw > -0.65
  return ['front', 'blink'].includes(prompt) && Math.abs(yaw) < 0.3
}
export function poseFeedback(prompt, face) {
  if (poseMatches(prompt, face)) return null
  const yaw = face.rotation?.angle?.yaw
  const pitch = face.rotation?.angle?.pitch
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) return 'Keep your whole face visible so the head angle can be measured.'
  if (Math.abs(pitch) > 0.45) return 'Keep your chin level. Turn sideways without looking up or down.'
  if (prompt === 'front' || prompt === 'blink') return 'Face the camera straight on and keep your chin level.'
  if (!['left', 'right'].includes(prompt)) return 'Follow the current head-position instruction.'
  const direction = prompt === 'left' ? 1 : -1
  const turn = yaw * direction
  if (turn < -0.08) return `Turn toward your own ${prompt} shoulder, not the opposite direction.`
  if (turn <= 0.12) return `Turn a little more toward your own ${prompt} shoulder, then hold still.`
  return 'You turned too far. Turn back slightly toward the camera and hold still.'
}
export function checkFrame(face, width, height) {
  if (!validEmbedding(face?.embedding) || face.faceScore < 0.75) throw new FaceError('Face is unclear. Improve the lighting and try again.')
  const box = face.box
  if (!box || box[2] < width*0.22 || box[3] < height*0.22 || box[0]<0 || box[1]<0
    || box[0]+box[2]>width || box[1]+box[3]>height) throw new FaceError('Keep your whole face in view and move a little closer.')
  if (!Number.isFinite(face.real) || !Number.isFinite(face.live))
    throw new FaceError('Liveness check failed. Use the live camera in good lighting.')
  if (face.real < LIVE_THRESHOLD || face.live < LIVE_THRESHOLD) {
    const error = new FaceError('Liveness check failed. Use the live camera in good lighting.')
    error.code = 'LIVENESS_RETRY'
    throw error
  }
}
export function validateFrames(frames, prompt) {
  const count = prompt === 'blink' ? 20 : 1
  if (!Array.isArray(frames) || frames.length !== count) throw new FaceError('Capture incomplete. Start a new scan.')
  return frames.map(value => {
    if (typeof value !== 'string' || value.length < 100 || value.length > 120000
      || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new FaceError('Invalid camera frame.')
    const buffer = Buffer.from(value, 'base64')
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) throw new FaceError('Only camera JPEG frames are accepted.')
    return buffer
  })
}
