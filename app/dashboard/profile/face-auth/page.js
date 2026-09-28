'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  createHuman,
  getFaceStatus,
  hasBlink,
} from '@/lib/face/humanClient'

const TOTAL_SCANS = 5
const FIRST_SCAN_DELAY_MS = 1500
const SCAN_INTERVAL_MS = 3000
const LIVENESS_THRESHOLD = 0.6

const FACE_CONNECTIONS = [
  [10, 338], [338, 297], [297, 332], [332, 284], [284, 251],
  [251, 389], [389, 356], [356, 454], [454, 323], [323, 361],
  [361, 288], [288, 397], [397, 365], [365, 379], [379, 378],
  [378, 400], [400, 377], [377, 152], [152, 148], [148, 176],
  [176, 149], [149, 150], [150, 136], [136, 172], [172, 58],
  [58, 132], [132, 93], [93, 234], [234, 127], [127, 162],
  [162, 21], [21, 54], [54, 103], [103, 67], [67, 109], [109, 10],
  [70, 63], [63, 105], [105, 66], [66, 107], [107, 55],
  [300, 293], [293, 334], [334, 296], [296, 336], [336, 285],
  [33, 160], [160, 158], [158, 133], [133, 153], [153, 144],
  [144, 33], [33, 7], [7, 163], [163, 144],
  [362, 385], [385, 387], [387, 263], [263, 373], [373, 380],
  [380, 362], [362, 382], [382, 398], [398, 384],
  [1, 2], [2, 98], [98, 327], [327, 326], [326, 97], [97, 168],
  [168, 6], [6, 197], [197, 5], [5, 4], [4, 1],
  [61, 146], [146, 91], [91, 181], [181, 84], [84, 17],
  [17, 314], [314, 405], [405, 321], [321, 375], [375, 291], [291, 61],
  [78, 95], [95, 88], [88, 178], [178, 87], [87, 14],
  [14, 317], [317, 402], [402, 318], [318, 324], [324, 308], [308, 78],
]

function FaceIcon({ className = 'h-6 w-6' }) {
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
      <circle cx="12" cy="12" r="8" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <path d="M8.5 14.5c2 2 5 2 7 0" />
      <path d="M4 8c1.5-3 4.5-5 8-5s6.5 2 8 5" />
    </svg>
  )
}

function CheckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function CameraIcon({ className = 'h-5 w-5' }) {
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
      <path d="M14 4h-4l-2 3H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-3Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export default function FaceAuthenticationPage() {
  const router = useRouter()

  const supabaseRef = useRef(null)
  if (!supabaseRef.current) {
    supabaseRef.current = createClient()
  }
  const supabase = supabaseRef.current

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const humanRef = useRef(null)

  const loopTimeoutRef = useRef(null)
  const loopRunningRef = useRef(false)
  const cancelledRef = useRef(false)
  const finishedRef = useRef(false)
  const finishingRef = useRef(false)

  const embeddingsRef = useRef([])
  const nextCaptureAtRef = useRef(0)
  const stableSinceRef = useRef(null)
  const blinkDetectedRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [humanReady, setHumanReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  const [faceDetected, setFaceDetected] = useState(false)
  const [faceReady, setFaceReady] = useState(false)
  const [faceScore, setFaceScore] = useState(0)
  const [realScore, setRealScore] = useState(0)
  const [liveScore, setLiveScore] = useState(0)
  const [blinkDetected, setBlinkDetected] = useState(false)

  const [scanCount, setScanCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [instruction, setInstruction] = useState(
    'Preparing face enrollment...',
  )
  const [finishing, setFinishing] = useState(false)
  const [finished, setFinished] = useState(false)
  const [cameraRequested, setCameraRequested] = useState(false)
  const [existingEnrollment, setExistingEnrollment] = useState(false)
  const [changeFaceOpen, setChangeFaceOpen] = useState(false)
  const [enrollmentAuthorized, setEnrollmentAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [authorizingChange, setAuthorizingChange] = useState(false)

  const drawFaceMesh = useCallback((face) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const mesh = face?.meshRaw

    if (!canvas || !video || !Array.isArray(mesh) || mesh.length === 0) {
      return
    }

    const rect = video.getBoundingClientRect()
    const width = Math.max(1, Math.floor(rect.width * 2))
    const height = Math.max(1, Math.floor(rect.height * 2))

    if (canvas.width !== width) canvas.width = width
    if (canvas.height !== height) canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)

    const point = (index) => {
      const raw = mesh[index]
      if (!Array.isArray(raw) || raw.length < 2) return null

      return {
        x: (1 - raw[0]) * canvas.width,
        y: raw[1] * canvas.height,
      }
    }

    context.lineWidth = 1.8
    const live = Number(face?.real ?? 0) >= LIVENESS_THRESHOLD
    const accent = live
      ? '52, 211, 153'
      : '56, 189, 248'

    const landmarkPoints = new Map()

    for (const [startIndex, endIndex] of FACE_CONNECTIONS) {
      const start = point(startIndex)
      const end = point(endIndex)
      if (start) landmarkPoints.set(startIndex, start)
      if (end) landmarkPoints.set(endIndex, end)
    }

    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle =
      Number(face?.real ?? 0) >= LIVENESS_THRESHOLD
        ? 'rgba(52, 211, 153, 0.9)'
        : 'rgba(96, 165, 250, 0.85)'

    // Soft neon halo behind the skeleton.
    context.save()
    context.lineWidth = 5
    context.strokeStyle = `rgba(${accent}, 0.16)`
    context.shadowColor = `rgba(${accent}, 0.95)`
    context.shadowBlur = 18

    for (const [startIndex, endIndex] of FACE_CONNECTIONS) {
      const start = point(startIndex)
      const end = point(endIndex)
      if (!start || !end) continue

      context.beginPath()
      context.moveTo(start.x, start.y)
      context.lineTo(end.x, end.y)
      context.stroke()
    }

    context.restore()

    // Crisp HUD-style skeleton lines.
    context.lineWidth = 1.35
    context.strokeStyle = `rgba(${accent}, 0.92)`
    context.shadowColor = `rgba(${accent}, 0.95)`
    context.shadowBlur = 6

    for (const [startIndex, endIndex] of FACE_CONNECTIONS) {
      const start = point(startIndex)
      const end = point(endIndex)
      if (!start || !end) continue

      context.beginPath()
      context.moveTo(start.x, start.y)
      context.lineTo(end.x, end.y)
      context.stroke()
    }

    // Small glowing nodes make the tracked landmarks visible without
    // changing the underlying Human landmark data or scan behavior.
    context.shadowBlur = 10
    context.fillStyle = `rgba(${accent}, 0.95)`

    for (const { x, y } of landmarkPoints.values()) {
      context.beginPath()
      context.arc(x, y, 2.1, 0, Math.PI * 2)
      context.fill()
    }

    // Center reticle gives the scanner a polished biometric HUD feel.
    const nose = point(1)
    if (nose) {
      context.shadowBlur = 14
      context.strokeStyle = `rgba(${accent}, 0.95)`
      context.lineWidth = 1.25
      context.beginPath()
      context.arc(nose.x, nose.y, 8, 0, Math.PI * 2)
      context.stroke()
      context.beginPath()
      context.moveTo(nose.x - 13, nose.y)
      context.lineTo(nose.x - 6, nose.y)
      context.moveTo(nose.x + 6, nose.y)
      context.lineTo(nose.x + 13, nose.y)
      context.moveTo(nose.x, nose.y - 13)
      context.lineTo(nose.x, nose.y - 6)
      context.moveTo(nose.x, nose.y + 6)
      context.lineTo(nose.x, nose.y + 13)
      context.stroke()
    }

  }, [])

  const clearFaceMesh = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const stopEverything = useCallback(() => {
    cancelledRef.current = true
    loopRunningRef.current = false

    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current)
      loopTimeoutRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    if (humanRef.current) {
      try {
        humanRef.current.stop?.()
      } catch {}
    }

    humanRef.current = null
    clearFaceMesh()
    setCameraReady(false)
  }, [clearFaceMesh])

  const authorizeFaceReplacement = useCallback(async () => {
    setPasswordError('')

    if (!password.trim()) {
      setPasswordError('Enter your account password to continue.')
      return
    }

    setAuthorizingChange(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user?.email) {
        throw new Error('Your session has expired. Please log in again.')
      }

      const { error: passwordError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password,
        })

      if (passwordError) throw new Error('Password verification failed.')

      setEnrollmentAuthorized(true)
      setChangeFaceOpen(false)
      setPassword('')
      setInstruction('Identity confirmed. You can now start face enrollment.')
    } catch (error) {
      setPasswordError(error?.message || 'Password verification failed.')
    } finally {
      setAuthorizingChange(false)
    }
  }, [password, supabase])

  const handleStartCamera = useCallback(() => {
    if (existingEnrollment && !enrollmentAuthorized) {
      setChangeFaceOpen(true)
      return
    }

    setCameraError('')
    setCameraRequested(true)
  }, [enrollmentAuthorized, existingEnrollment])

  const handleRetry = useCallback(() => {
    stopEverything()
    setCameraRequested(false)
    setCameraError('')
    setFinished(false)
    setFinishing(false)
    setScanCount(0)
    setCountdown(0)
    setFaceDetected(false)
    setFaceReady(false)
    setFaceScore(0)
    setRealScore(0)
    setLiveScore(0)
    setBlinkDetected(false)
    embeddingsRef.current = []
    finishedRef.current = false
    finishingRef.current = false
    cancelledRef.current = false
    blinkDetectedRef.current = false
    stableSinceRef.current = null
    nextCaptureAtRef.current = 0
    setInstruction('Ready when you are. Click Start Camera & Scan to try again.')
  }, [stopEverything])
  const finishEnrollment = useCallback(async () => {
    if (
      finishingRef.current ||
      finishing ||
      embeddingsRef.current.length !== TOTAL_SCANS
    ) {
      return
    }

    finishingRef.current = true
    setFinishing(true)
    finishedRef.current = true

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Your session has expired. Please log in again.')
      }

      const embeddings = embeddingsRef.current

      if (embeddings.length !== TOTAL_SCANS) {
        throw new Error('Not all face-recognition samples were captured.')
      }

      const { error: enrollmentError } = await supabase
        .from('face_enrollments')
        .upsert(
          {
            user_id: user.id,
            face_template: {
              version: 2,
              model: 'human-faceres',
              model_version: '3.3.6',
              embeddings,
              enrollment_method: 'continuous-multiscan',
              scan_interval_ms: SCAN_INTERVAL_MS,
            },
            sample_count: embeddings.length,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )

      if (enrollmentError) {
        throw new Error(
          enrollmentError.message ||
            'We could not save your face enrollment.',
        )
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          face_auth_enabled: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        throw new Error(
          profileError.message ||
            'Your face profile was saved, but activation failed.',
        )
      }

      console.log('Human face enrollment saved.', {
        samples: embeddings.length,
        model: 'human-faceres',
        version: 2,
      })

      setInstruction('Face profile saved successfully.')
      stopEverything()

      await new Promise((resolve) => setTimeout(resolve, 700))
      router.push('/dashboard/profile')
    } catch (error) {
      console.error('Face enrollment save failed:', error)
      finishedRef.current = false
      finishingRef.current = false
      setFinishing(false)
      setCameraError(
        error?.message ||
          'Something went wrong while saving your face enrollment.',
      )
    }
  }, [
    existingEnrollment,
    enrollmentAuthorized,
    finishing,
    router,
    stopEverything,
    supabase,
  ])

  const runLoop = useCallback(async () => {
    if (loopRunningRef.current || cancelledRef.current || finishedRef.current) {
      return
    }

    loopRunningRef.current = true

    const tick = async () => {
      if (cancelledRef.current || finishedRef.current) {
        loopRunningRef.current = false
        return
      }

      const human = humanRef.current
      const video = videoRef.current

      if (
        !human ||
        !video ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        loopTimeoutRef.current = setTimeout(tick, 120)
        return
      }

      try {
        const detection = await human.detect(video)
        const faces = Array.isArray(detection?.face) ? detection.face : []
        const exactlyOneFace = faces.length === 1

        setFaceDetected(exactlyOneFace)

        if (!exactlyOneFace) {
          stableSinceRef.current = null
          setFaceReady(false)
          setCountdown(0)
          clearFaceMesh()
          setFaceScore(0)
          setRealScore(0)
          setLiveScore(0)

          setInstruction(
            faces.length === 0
              ? 'Position your face inside the guide'
              : 'Only one face should be visible during enrollment',
          )
        } else {
          const face = faces[0]
          drawFaceMesh(face)

          if (hasBlink(detection)) {
            blinkDetectedRef.current = true
            setBlinkDetected(true)
          }

          const status = getFaceStatus(face, video)
          const real = Number(face.real ?? 0)
          const live = Number(face.live ?? 0)
          const livenessReady =
            real >= LIVENESS_THRESHOLD && live >= LIVENESS_THRESHOLD

          setFaceScore(status.faceScore)
          setRealScore(real)
          setLiveScore(live)
          setFaceReady(status.ok && livenessReady)

          if (!status.ok) {
            stableSinceRef.current = null
            setCountdown(0)
            setInstruction(status.reason)
          } else if (!livenessReady) {
            stableSinceRef.current = null
            setCountdown(0)
            setInstruction(
              'Hold still while the live-face check runs.',
            )
          } else if (!face.embedding?.length) {
            stableSinceRef.current = null
            setCountdown(0)
            setInstruction(
              'Face detected. Preparing the recognition embedding...',
            )
          } else {
            if (!stableSinceRef.current) {
              stableSinceRef.current = Date.now()
            }

            const now = Date.now()
            const remaining = Math.max(
              0,
              nextCaptureAtRef.current - now,
            )

            setCountdown(Math.ceil(remaining / 1000))

            const stableFor = now - stableSinceRef.current

            if (
              stableFor >= 700 &&
              now >= nextCaptureAtRef.current &&
              embeddingsRef.current.length < TOTAL_SCANS
            ) {
              embeddingsRef.current.push(Array.from(face.embedding))

              const newCount = embeddingsRef.current.length
              setScanCount(newCount)
              stableSinceRef.current = null

              if (newCount < TOTAL_SCANS) {
                nextCaptureAtRef.current = now + SCAN_INTERVAL_MS
                setCountdown(Math.ceil(SCAN_INTERVAL_MS / 1000))
                setInstruction(
                  `Scan ${newCount} captured. Keep looking at the camera for the next scan.`,
                )
              } else {
                setCountdown(0)
                setInstruction(
                  'All recognition scans captured. Saving your face profile...',
                )
                setFinished(true)
                loopRunningRef.current = false

                setTimeout(() => {
                  finishEnrollment()
                }, 0)

                return
              }
            } else {
              setInstruction(
                blinkDetectedRef.current
                  ? `Face tracked. Next scan in ${Math.max(
                      0,
                      Math.ceil(remaining / 1000),
                    )}s.`
                  : 'Face tracked. Blink naturally while looking at the camera.',
              )
            }
          }
        }
      } catch (error) {
        console.error('Human face enrollment detection failed:', error)
        setInstruction('Face scanner is processing. Please hold steady.')
      }

      if (!cancelledRef.current && !finishedRef.current) {
        loopTimeoutRef.current = setTimeout(tick, 120)
      } else {
        loopRunningRef.current = false
      }
    }

    await tick()
  }, [clearFaceMesh, drawFaceMesh, finishEnrollment])

  useEffect(() => {
    let active = true

    cancelledRef.current = false
    finishedRef.current = false
    finishingRef.current = false
    embeddingsRef.current = []
    setScanCount(0)
    setFinished(false)
    setFinishing(false)
    setCameraError('')

    async function initializeHuman() {
      try {
        setLoading(true)
        setInstruction('Loading face-recognition engine...')

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        if (!user) {
          router.push('/login')
          return
        }

        const { data: existingFace, error: existingFaceError } =
          await supabase
            .from('face_enrollments')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (existingFaceError) throw existingFaceError

        const hasExistingFace = Boolean(existingFace)
        setExistingEnrollment(hasExistingFace)
        setEnrollmentAuthorized(!hasExistingFace)
        setChangeFaceOpen(hasExistingFace)

        // Enrollment creates/replaces the template only after the replacement
        // confirmation and password re-authentication have succeeded.
        const human = await createHuman()

        if (!active) {
          try {
            human.stop?.()
          } catch {}
          return
        }

        humanRef.current = human
        setHumanReady(true)
        setLoading(false)
        setInstruction(
          hasExistingFace
            ? 'Face profile found. Confirm replacement to continue.'
            : 'Face-recognition engine ready. Click Start Camera & Scan when you are ready.',
        )
      } catch (error) {
        console.error('Face enrollment initialization failed:', error)

        if (active) {
          setCameraError(
            error?.message ||
              'Unable to initialize face enrollment.',
          )
          setLoading(false)
        }
      }
    }

    initializeHuman()

    return () => {
      active = false
    }
  }, [router, supabase])

  useEffect(() => {
    if (
      !humanReady ||
      cameraReady ||
      cameraError ||
      finished ||
      !cameraRequested ||
      !enrollmentAuthorized
    ) return

    let active = true

    async function initializeCamera() {
      try {
        let video = videoRef.current
        const startedAt = performance.now()

        while (
          !video &&
          active &&
          performance.now() - startedAt < 5000
        ) {
          await new Promise((resolve) => {
            requestAnimationFrame(resolve)
          })
          video = videoRef.current
        }

        if (!active) return

        if (!video) {
          throw new Error(
            'Camera element could not be mounted. Please refresh the page and try again.',
          )
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Camera access is not supported by this browser.',
          )
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        video.srcObject = stream

        await new Promise((resolve) => {
          if (video.readyState >= 1) {
            resolve()
            return
          }
          video.onloadedmetadata = resolve
        })

        if (!active) return

        await video.play()
        if (!active) return

        setCameraReady(true)
        nextCaptureAtRef.current = Date.now() + FIRST_SCAN_DELAY_MS
        setCountdown(2)
        setInstruction(
          'Look at the camera. Your face will be scanned automatically.',
        )

        runLoop()
      } catch (error) {
        console.error('Camera initialization failed:', error)

        if (active) {
          setCameraError(
            error?.message || 'Unable to access your camera.',
          )
        }
      }
    }

    initializeCamera()

    return () => {
      active = false
    }
  }, [
    cameraError,
    cameraReady,
    cameraRequested,
    enrollmentAuthorized,
    finished,
    humanReady,
    runLoop,
  ])

  useEffect(() => {
    return () => {
      stopEverything()
    }
  }, [stopEverything])

  function handleCancel() {
    stopEverything()
    router.push('/dashboard/profile')
  }

  const progress = (scanCount / TOTAL_SCANS) * 100

  return (
    <>
      {changeFaceOpen && existingEnrollment && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
        <Card className="w-full max-w-md p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-slate-900">
            Change your face profile?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            A face profile is already configured. Replacing it will save a new
            face profile for this account.
          </p>
          <label className="mt-5 block text-sm font-medium text-slate-700">
            Confirm with your password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Your account password"
            />
          </label>
          {passwordError && (
            <p className="mt-2 text-sm text-red-600">{passwordError}</p>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => router.push('/dashboard/profile')}
              disabled={authorizingChange}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={authorizeFaceReplacement}
              disabled={authorizingChange || !password}
            >
              {authorizingChange ? 'Verifying...' : 'Confirm & Continue'}
            </Button>
          </div>
        </Card>
      </div>
    )}
    <div className="min-h-[100dvh] w-full overflow-x-hidden p-3 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={handleCancel}
              className="mb-3 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              ← Back to Profile
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FaceIcon />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Face Authentication
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Create your face profile using continuous recognition scans.
                </p>
              </div>
            </div>
          </div>
        </div>

        {cameraError && (
          <Card className="mt-6 border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <div className="mt-0.5 text-red-600">
                <CameraIcon />
              </div>
              <div>
                <h2 className="font-semibold text-red-800">
                  Face enrollment unavailable
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-red-700">
                  {cameraError}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-red-600">
                  Make sure your browser has camera permission and you are using HTTPS or localhost.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-5 grid gap-5 lg:mt-8 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden border-white/80 bg-white/90 p-2 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-slate-950 shadow-inner sm:rounded-[2rem] sm:aspect-video">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />

              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2 sm:left-5 sm:right-5 sm:top-5">
                  <div className="rounded-full border border-white/20 bg-slate-950/55 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md sm:px-3 sm:text-xs">
                    {humanReady
                      ? 'Face recognition ready'
                      : 'Loading scanner...'}
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/55 px-2.5 py-1.5 text-[10px] text-white shadow-lg backdrop-blur-md sm:gap-2 sm:px-3 sm:text-xs">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        faceDetected ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    {faceDetected ? 'Face tracked' : 'Searching'}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`relative h-[70%] w-[58%] max-w-[320px] rounded-[48%] border-2 border-dashed transition-colors sm:h-[78%] sm:w-[48%] ${
                      faceReady ? 'border-emerald-300' : 'border-white/35'
                    }`}
                  >
                    <div className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-cyan-300" />
                    <div className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-cyan-300" />
                    <div className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-cyan-300" />
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-cyan-300" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex justify-center sm:bottom-5 sm:left-5 sm:right-5">
                  <div className="max-w-xl rounded-2xl border border-white/15 bg-slate-950/65 px-3 py-2.5 text-center text-xs font-semibold text-white shadow-xl backdrop-blur-md sm:px-5 sm:py-3 sm:text-sm">
                    {instruction}
                    {countdown > 0 && scanCount < TOTAL_SCANS
                      ? ` ${countdown}s`
                      : ''}
                  </div>
                </div>
              </div>

              {(loading || (humanReady && !cameraReady)) && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                  <div className="text-center text-white">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <p className="mt-4 text-sm font-medium">
                      {loading
                        ? 'Loading face recognition...'
                        : 'Starting camera...'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!cameraReady && !cameraRequested && !finished && (
              <div className="px-1 pt-4">
                <Button
                  onClick={handleStartCamera}
                  disabled={!humanReady || loading}
                  className="w-full"
                >
                  <CameraIcon className="mr-2 h-5 w-5" />
                  {loading ? 'Preparing face recognition...' : 'Start Camera & Scan'}
                </Button>
              </div>
            )}
            <div className="px-1 pb-1 pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  Enrollment Progress
                </p>
                <p className="text-sm font-bold text-indigo-600">
                  {Math.round(progress)}%
                </p>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-lg shadow-slate-200/40 sm:p-6 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FaceIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Face Enrollment</h2>
                <p className="text-xs text-slate-500">
                  Automatic recognition scans
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {Array.from({ length: TOTAL_SCANS }, (_, index) => {
                const complete = scanCount > index
                const active = !finished && scanCount === index

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
                      complete
                        ? 'border-emerald-100 bg-emerald-50'
                        : active
                          ? 'border-indigo-200 bg-indigo-50'
                          : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        complete
                          ? 'bg-emerald-500 text-white'
                          : active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {complete ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          complete
                            ? 'text-emerald-800'
                            : active
                              ? 'text-indigo-800'
                              : 'text-slate-700'
                        }`}
                      >
                        Scan {index + 1}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {complete
                          ? 'Captured'
                          : active
                            ? 'Waiting for a good frame'
                            : 'Pending'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-4 text-[11px] text-slate-500">
              <div className="flex justify-between gap-3">
                <span>Face detected</span>
                <span className="font-semibold text-slate-700">
                  {faceDetected ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Face quality</span>
                <span className="font-semibold text-slate-700">
                  {faceScore ? `${Math.round(faceScore * 100)}%` : '—'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Real-face signal</span>
                <span className="font-semibold text-slate-700">
                  {realScore ? `${Math.round(realScore * 100)}%` : '—'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Liveness signal</span>
                <span className="font-semibold text-slate-700">
                  {liveScore ? `${Math.round(liveScore * 100)}%` : '—'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>Blink</span>
                <span
                  className={`font-semibold ${
                    blinkDetected ? 'text-emerald-600' : 'text-slate-700'
                  }`}
                >
                  {blinkDetected ? 'Detected' : 'Optional'}
                </span>
              </div>
            </div>

            {finished && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      Face profile captured
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-700">
                      The new recognition embeddings are being saved to your account.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="primary" disabled className="w-full">
                    {finishing ? 'Saving...' : 'Saving face profile...'}
                  </Button>
                </div>
              </div>
            )}

            {!finished && (
              <div className="mt-6">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </Card>
        </div>

        <Card className="mt-6 border-slate-200 bg-slate-50 p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <FaceIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Face authentication privacy
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                The camera feed is processed in the browser. This enrollment stores face-recognition embeddings rather than photographs. Re-enrollment replaces the existing face-recognition template for this account.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>    </>
  )
}