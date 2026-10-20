// Node.js only. Intentionally not the browser Human loader.
const fs = require('node:fs/promises')
const path = require('node:path')
const { pathToFileURL, fileURLToPath } = require('node:url')
const { createHash } = require('node:crypto')
const { createRequire } = require('node:module')
// Keep TF dependencies statically visible to Next's dependency tracer.
require('@tensorflow/tfjs-converter')
require('@tensorflow/tfjs-backend-wasm')
const packageRequire = createRequire(path.join(process.cwd(), 'package.json'))
const humanDist = path.dirname(packageRequire.resolve('@vladmandic/human'))
const { Human } = packageRequire(path.join(humanDist, 'human.node-wasm.js'))
const sharp = require('sharp')
let loading
let busy = false
let routerRegistered = false

async function engine() {
  if (loading) return loading
  loading = (async () => {
    const dist = humanDist
    const models = path.resolve(dist, '../models')
    const wasm = path.dirname(packageRequire.resolve('@tensorflow/tfjs-backend-wasm')) + path.sep
    const human = new Human({
      backend: 'wasm', debug: false, async: false,
      modelBasePath: pathToFileURL(models + path.sep).href, wasmPath: wasm,
      cacheModels: false, cacheSensitivity: 0, skipAllowed: false,
      filter: { enabled: true, equalization: true, return: false },
      face: {
        enabled: true, detector: { maxDetected: 2, minConfidence: 0.6, rotation: true, return: false },
        mesh: { enabled: true }, iris: { enabled: true }, description: { enabled: true },
        emotion: { enabled: false }, antispoof: { enabled: true }, liveness: { enabled: true },
      },
      gesture: { enabled: false }, body: { enabled: false }, hand: { enabled: false },
      object: { enabled: false }, segmentation: { enabled: false },
    })
    if (!routerRegistered) {
      human.tf.io.registerLoadRouter(url => {
        if (typeof url !== 'string' || !url.startsWith('file:')) return null
        return { load: async () => {
          const filename = fileURLToPath(url)
          if (path.dirname(filename) !== models) throw new Error('Invalid model path')
          const manifest = JSON.parse(await fs.readFile(filename, 'utf8'))
          const buffers = [], weightSpecs = []
          for (const group of manifest.weightsManifest) {
            weightSpecs.push(...group.weights)
            for (const part of group.paths) {
              const weight = path.resolve(models, part)
              if (path.dirname(weight) !== models) throw new Error('Invalid model weight path')
              buffers.push(await fs.readFile(weight))
            }
          }
          const data = Buffer.concat(buffers)
          // Signature includes the embedding output; omitting it loses identity data.
          return { modelTopology: manifest.modelTopology, signature: manifest.signature,
            weightSpecs, weightData: data.buffer.slice(data.byteOffset, data.byteOffset+data.byteLength) }
        } }
      })
      routerRegistered = true
    }
    await human.load()
    if (human.tf.getBackend() !== 'wasm' || human.models.loaded().length !== 6) throw new Error('Models unavailable')
    return human
  })().catch(error => { loading = undefined; throw error })
  return loading
}

async function scan({ frames, prompt, previous, reference }) {
  const policy = await import('./policy.mjs')
  if (busy) throw new policy.FaceError('Scanner is busy. Please start again in a moment.', 503)
  busy = true
  try {
    const human = await engine()
    const images = policy.validateFrames(frames, prompt)
    const hashes = [], faces = []
    let poseProblem = null
    let livenessProblem = false
    for (const buffer of images) {
      const metadata = await sharp(buffer, { limitInputPixels: 640*640 }).metadata()
      if (metadata.format !== 'jpeg' || metadata.width < 240 || metadata.height < 240
        || metadata.width > 640 || metadata.height > 640 || (metadata.pages || 1) !== 1)
        throw new policy.FaceError('Invalid camera dimensions. Restart the camera.')
      const { data, info } = await sharp(buffer, { limitInputPixels: 640*640 }).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true })
      const hash = createHash('sha256').update(data).digest('hex')
      if (previous.hashes.includes(hash) || hashes.includes(hash)) throw new policy.FaceError('Repeated frame detected. Capture a fresh live scan.')
      hashes.push(hash)
      const input = human.tf.tensor4d(new Float32Array(data), [1,info.height,info.width,3])
      let result
      try { result = await human.detect(input) } finally { input.dispose() }
      if (result.error) throw new policy.FaceError('Scanner could not process this capture. Please try again.')
      if (result.face.length !== 1) throw new policy.FaceError('Keep exactly one face in the camera view.')
      const face = result.face[0]
      try {
        policy.checkFrame(face, info.width, info.height)
      } catch (error) {
        // Only a measured, below-threshold liveness result is retryable.
        // Missing scores, poor framing and all other errors remain terminal.
        if (!(error instanceof policy.FaceError) || error.code !== 'LIVENESS_RETRY') throw error
        livenessProblem = true
      }
      const first = previous.embeddings[0] || faces[0]?.embedding
      const firstStructure = previous.structures?.[0] || faces[0]?.structure
      const embeddingSimilarity = first
        ? human.match.similarity(first,face.embedding,policy.MATCH_OPTIONS) : null
      const structure = policy.faceStructure(face.mesh)
      if (first && embeddingSimilarity < policy.CONTINUITY_THRESHOLD) {
        const geometrySimilarity = firstStructure
          ? policy.structureSimilarity(firstStructure,structure) : 0
        if (geometrySimilarity < policy.STRUCTURE_THRESHOLD) {
          throw new policy.FaceError('Face changed during the scan. Keep the same person in view.')
        }
      }
      // Still check liveness and identity continuity on every frame. A pose
      // miss never counts as an accepted sample, even if it is retryable.
      poseProblem ||= policy.poseFeedback(prompt, face)
      faces.push({ ...face, structure })
    }
    if (prompt === 'blink' && !policy.hasBlink(faces.map(face => policy.eyeRatio(face.mesh))))
      throw new policy.FaceError('Blink not detected. Start again, then close and reopen your eyes during the blink capture.')
    // Complete all frame checks before offering a retry: identity switches,
    // replay and missing blink must never be hidden by a low liveness score.
    // Return no embedding or score from this rejected capture.
    if (livenessProblem) return { hashes, livenessFeedback:
      'The live-face check could not confirm this capture. Light your face from the front, reduce bright light behind you, hold the requested pose still, and try again.' }
    if (poseProblem) return { hashes, poseFeedback: poseProblem }
    const embedding = faces[0].embedding
    const score = reference?.length
      ? Math.max(...reference.map(value => human.match.similarity(value,embedding,policy.MATCH_OPTIONS))) : 0
    return { embedding, structure: faces[0].structure, score, hashes }
  } finally { busy = false }
}
module.exports = { scan, engine }
