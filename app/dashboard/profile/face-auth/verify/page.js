'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  createHuman,
  getFaceStatus,
  hasBlink,
  MATCH_OPTIONS,
} from '@/lib/face/humanClient'

const TOTAL_SCANS = 5
const SCAN_INTERVAL_MS = 3000

const REQUIRED_MATCHES = 4

/*
 * These are starting values for testing.
 * They should be calibrated later using genuine-user
 * and different-user verification results.
 */
const SIMILARITY_THRESHOLD = 0.62
const MIN_AVERAGE_SIMILARITY = 0.64

const HUMAN_LIVENESS_THRESHOLD = 0.6

const FACE_CONNECTIONS = [
  // Face outline
  [10, 338],
  [338, 297],
  [297, 332],
  [332, 284],
  [284, 251],
  [251, 389],
  [389, 356],
  [356, 454],
  [454, 323],
  [323, 361],
  [361, 288],
  [288, 397],
  [397, 365],
  [365, 379],
  [379, 378],
  [378, 400],
  [400, 377],
  [377, 152],
  [152, 148],
  [148, 176],
  [176, 149],
  [149, 150],
  [150, 136],
  [136, 172],
  [172, 58],
  [58, 132],
  [132, 93],
  [93, 234],
  [234, 127],
  [127, 162],
  [162, 21],
  [21, 54],
  [54, 103],
  [103, 67],
  [67, 109],
  [109, 10],

  // Left eyebrow
  [70, 63],
  [63, 105],
  [105, 66],
  [66, 107],
  [107, 55],

  // Right eyebrow
  [300, 293],
  [293, 334],
  [334, 296],
  [296, 336],
  [336, 285],

  // Left eye
  [33, 160],
  [160, 158],
  [158, 133],
  [133, 153],
  [153, 144],
  [144, 33],
  [33, 7],
  [7, 163],
  [163, 144],

  // Right eye
  [362, 385],
  [385, 387],
  [387, 263],
  [263, 373],
  [373, 380],
  [380, 362],
  [362, 382],
  [382, 398],
  [398, 384],

  // Nose
  [1, 2],
  [2, 98],
  [98, 327],
  [327, 326],
  [326, 97],
  [97, 168],
  [168, 6],
  [6, 197],
  [197, 5],
  [5, 4],
  [4, 1],

  // Mouth outer
  [61, 146],
  [146, 91],
  [91, 181],
  [181, 84],
  [84, 17],
  [17, 314],
  [314, 405],
  [405, 321],
  [321, 375],
  [375, 291],
  [291, 61],

  // Mouth inner
  [78, 95],
  [95, 88],
  [88, 178],
  [178, 87],
  [87, 14],
  [14, 317],
  [317, 402],
  [402, 318],
  [318, 324],
  [324, 308],
  [308, 78],
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

function FaceVerificationContent({ unlockMode = false }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedNext = searchParams.get('next')
  const nextPath = requestedNext?.startsWith('/')
    ? requestedNext
    : '/dashboard'

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

  const enrollmentRef = useRef(null)
  const scanSamplesRef = useRef([])

  const nextCaptureAtRef = useRef(0)
  const stableSinceRef = useRef(null)
  const blinkDetectedRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [humanReady, setHumanReady] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraRequested, setCameraRequested] = useState(false)

  const [cameraError, setCameraError] = useState('')

  const [faceDetected, setFaceDetected] = useState(false)
  const [faceReady, setFaceReady] = useState(false)
  const [faceScore, setFaceScore] = useState(0)

  const [scanCount, setScanCount] = useState(0)
  const [countdown, setCountdown] = useState(0)

  const [blinkDetected, setBlinkDetected] =
    useState(false)

  const [
    verificationPhase,
    setVerificationPhase,
  ] = useState('loading')

  const [
    instruction,
    setInstruction,
  ] = useState(
    'Preparing face verification...',
  )

  const [verifying, setVerifying] =
    useState(false)

  const [finished, setFinished] =
    useState(false)

  const [result, setResult] =
    useState(null)

  const drawFaceMesh = useCallback((face) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const mesh = face?.meshRaw

    if (!canvas || !video || !mesh?.length) {
      return
    }

    const rect = video.getBoundingClientRect()

    const width = Math.max(
      1,
      Math.floor(rect.width * 2),
    )

    const height = Math.max(
      1,
      Math.floor(rect.height * 2),
    )

    if (canvas.width !== width) {
      canvas.width = width
    }

    if (canvas.height !== height) {
      canvas.height = height
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const point = (index) => {
      const raw = mesh[index]

      if (!raw) {
        return null
      }

      return {
        x:
          (1 - raw[0]) *
          canvas.width,

        y:
          raw[1] *
          canvas.height,
      }
    }

    const live = Number(face?.real ?? 0) >= HUMAN_LIVENESS_THRESHOLD
    const accent = live ? '52, 211, 153' : '56, 189, 248'
    const landmarkPoints = new Map()

    for (const [startIndex, endIndex] of FACE_CONNECTIONS) {
      const start = point(startIndex)
      const end = point(endIndex)
      if (start) landmarkPoints.set(startIndex, start)
      if (end) landmarkPoints.set(endIndex, end)
    }

    context.lineCap = 'round'
    context.lineJoin = 'round'

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
    context.lineWidth = 1.35
    context.strokeStyle = `rgba(${accent}, 0.92)`
    context.shadowColor = `rgba(${accent}, 0.95)`
    context.shadowBlur = 6

    for (
      const [
        startIndex,
        endIndex,
      ] of FACE_CONNECTIONS
    ) {
      const start = point(startIndex)
      const end = point(endIndex)

      if (!start || !end) {
        continue
      }

      context.beginPath()
      context.moveTo(
        start.x,
        start.y,
      )
      context.lineTo(
        end.x,
        end.y,
      )
      context.stroke()
    }

    context.shadowBlur = 10
    context.fillStyle = `rgba(${accent}, 0.95)`

    for (const { x, y } of landmarkPoints.values()) {
      context.beginPath()
      context.arc(x, y, 2.1, 0, Math.PI * 2)
      context.fill()
    }

    const nose = point(1)
    if (nose) {
      context.shadowBlur = 14
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
    const context =
      canvas?.getContext('2d')

    if (canvas && context) {
      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }
  }, [])

  // Stops only the camera and scan loop. Human remains loaded for retries.
  const stopCamera =
    useCallback(() => {
      cancelledRef.current = true
      loopRunningRef.current = false

      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current)
        loopTimeoutRef.current = null
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop())
        streamRef.current = null
      }

      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      }

      clearFaceMesh()
      setCameraReady(false)
    }, [clearFaceMesh])

  const verifyFace =
    useCallback(async () => {
      if (
        verifying ||
        scanSamplesRef.current.length !==
          TOTAL_SCANS
      ) {
        return
      }

      setVerifying(true)
      setVerificationPhase('analyzing')

      setInstruction(
        'Analyzing your face...',
      )

      try {
        const template =
          enrollmentRef.current

        const enrolled =
          Array.isArray(
            template?.embeddings,
          )
            ? template.embeddings
            : []

        if (!enrolled.length) {
          throw new Error(
            'No compatible face-recognition enrollment was found. Please re-enroll your face.',
          )
        }

        const human =
          humanRef.current

        if (!human) {
          throw new Error(
            'Face-recognition engine is not ready.',
          )
        }

        const sampleResults =
          scanSamplesRef.current.map(
            (sample) => {
              const similarities =
                enrolled
                  .filter(
                    (embedding) =>
                      Array.isArray(
                        embedding,
                      ) &&
                      embedding.length,
                  )
                  .map(
                    (embedding) =>
                      human.match.similarity(
                        sample.embedding,
                        embedding,
                        MATCH_OPTIONS,
                      ),
                  )

              return similarities.length
                ? Math.max(
                    ...similarities,
                  )
                : 0
            },
          )

        const matchedCount =
          sampleResults.filter(
            (score) =>
              score >=
              SIMILARITY_THRESHOLD,
          ).length

        const averageSimilarity =
          sampleResults.reduce(
            (sum, value) =>
              sum + value,
            0,
          ) /
          sampleResults.length

        const bestSimilarity =
          Math.max(
            ...sampleResults,
          )

        const livePassed =
          scanSamplesRef.current.filter(
            (sample) =>
              sample.real >=
                HUMAN_LIVENESS_THRESHOLD &&
              sample.live >=
                HUMAN_LIVENESS_THRESHOLD,
          ).length >= 3

        const matched =
          matchedCount >=
            REQUIRED_MATCHES &&
          averageSimilarity >=
            MIN_AVERAGE_SIMILARITY &&
          blinkDetectedRef.current &&
          livePassed

        const comparison = {
          matched,
          scanCount:
            sampleResults.length,

          matchedCount,

          requiredMatches:
            REQUIRED_MATCHES,

          bestSimilarity,

          averageSimilarity,

          similarities:
            sampleResults,

          blinkDetected:
            blinkDetectedRef.current,

          livePassed,
        }

        console.log(
          'Human face verification result:',
          comparison,
        )

        const failureMessage =
          !livePassed
            ? 'Liveness verification failed. Make sure your face is clearly visible and use the live camera.'
            : !blinkDetectedRef.current
              ? 'Blink required. Please blink naturally once while your face is visible.'
              : matchedCount < REQUIRED_MATCHES ||
                  averageSimilarity < MIN_AVERAGE_SIMILARITY
                ? 'Face not recognized. The detected face does not match the enrolled face profile.'
                : 'Face verification did not pass. Please try again.'

        setResult({
          matched,
          message: matched
            ? 'Your live face matched the enrolled face profile across multiple scans.'
            : failureMessage,
          comparison,
        })

        if (matched) {
          setVerificationPhase(
            'verified',
          )

          setInstruction(
            'Face verified successfully.',
          )

          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(
              'cctc_unlock_at',
              String(Date.now()),
            )
          }

          setTimeout(() => {
            router.push(nextPath)
            router.refresh()
          }, 700)
        } else {
          setVerificationPhase(
            'failed',
          )

          setInstruction(
            'Face verification did not pass.',
          )
        }

        stopCamera()
      } catch (error) {
        console.error(
          'Face verification failed:',
          error,
        )

        setVerificationPhase(
          'failed',
        )

        setInstruction(
          'Face verification could not be completed.',
        )

        setResult({
          matched: false,

          message:
            error?.message ||
            'Unable to complete face verification.',
        })
      } finally {
        setVerifying(false)
      }
    }, [
      stopCamera,
      nextPath,
      router,
      verifying,
    ])

  const runLoop =
    useCallback(async () => {
      if (
        loopRunningRef.current ||
        cancelledRef.current
      ) {
        return
      }

      loopRunningRef.current = true

      const tick = async () => {
        if (
          cancelledRef.current ||
          verificationPhase ===
            'verified' ||
          verificationPhase ===
            'failed'
        ) {
          loopRunningRef.current = false
          return
        }

        const human =
          humanRef.current

        const video =
          videoRef.current

        if (
          !human ||
          !video ||
          video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
          loopTimeoutRef.current =
            setTimeout(
              tick,
              120,
            )

          return
        }

        try {
          const detection =
            await human.detect(video)

          const faces =
            Array.isArray(
              detection?.face,
            )
              ? detection.face
              : []

          const exactlyOneFace =
            faces.length === 1

          setFaceDetected(
            exactlyOneFace,
          )

          if (exactlyOneFace) {
            const face = faces[0]

            drawFaceMesh(face)

            if (
              hasBlink(detection)
            ) {
              blinkDetectedRef.current =
                true

              setBlinkDetected(true)
            }

            const status =
              getFaceStatus(
                face,
                video,
              )

            setFaceScore(
              status.faceScore,
            )

            setFaceReady(
              status.ok,
            )

            if (status.ok) {
              if (
                !stableSinceRef.current
              ) {
                stableSinceRef.current =
                  Date.now()
              }

              const now =
                Date.now()

              const remaining =
                Math.max(
                  0,
                  nextCaptureAtRef.current -
                    now,
                )

              setCountdown(
                Math.ceil(
                  remaining / 1000,
                ),
              )

              const stableFor =
                now -
                stableSinceRef.current

              if (
                stableFor >= 700 &&
                now >=
                  nextCaptureAtRef.current &&
                scanSamplesRef.current
                  .length <
                  TOTAL_SCANS
              ) {
                if (
                  face.embedding?.length
                ) {
                  scanSamplesRef.current.push(
                    {
                      embedding:
                        Array.from(
                          face.embedding,
                        ),

                      real: Number(
                        face.real ?? 0,
                      ),

                      live: Number(
                        face.live ?? 0,
                      ),

                      capturedAt:
                        new Date().toISOString(),
                    },
                  )

                  const newScanCount =
                    scanSamplesRef.current
                      .length

                  setScanCount(
                    newScanCount,
                  )

                  stableSinceRef.current =
                    null

                  if (
                    newScanCount <
                    TOTAL_SCANS
                  ) {
                    nextCaptureAtRef.current =
                      now +
                      SCAN_INTERVAL_MS

                    setCountdown(
                      Math.ceil(
                        SCAN_INTERVAL_MS /
                          1000,
                      ),
                    )

                    setInstruction(
                      `Scan ${newScanCount} captured. Keep looking at the camera.`,
                    )
                  } else {
                    setCountdown(0)

                    setInstruction(
                      'All scans captured. Analyzing identity...',
                    )

                    setFinished(true)

                    setVerificationPhase(
                      'analyzing',
                    )

                    loopRunningRef.current =
                      false

                    setTimeout(
                      () => {
                        verifyFace()
                      },
                      0,
                    )

                    return
                  }
                }
              } else {
                setInstruction(
                  blinkDetectedRef.current
                    ? `Face tracked. Next scan in ${Math.max(
                        0,
                        Math.ceil(
                          remaining /
                            1000,
                        ),
                      )}s.`
                    : 'Face tracked. Blink naturally once during the scan.',
                )
              }
            } else {
              stableSinceRef.current =
                null

              setCountdown(0)

              setInstruction(
                status.reason,
              )
            }
          } else {
            stableSinceRef.current =
              null

            setFaceReady(false)

            setCountdown(0)

            clearFaceMesh()

            setInstruction(
              faces.length === 0
                ? 'Position your face inside the guide'
                : 'Only one face should be visible during verification',
            )
          }
        } catch (error) {
          console.error(
            'Human face detection failed:',
            error,
          )

          setInstruction(
            'Face scanner is processing. Please hold steady.',
          )
        }

        if (
          !cancelledRef.current &&
          verificationPhase !==
            'verified' &&
          verificationPhase !==
            'failed'
        ) {
          loopTimeoutRef.current =
            setTimeout(
              tick,
              120,
            )
        } else {
          loopRunningRef.current =
            false
        }
      }

      await tick()
    }, [
      clearFaceMesh,
      drawFaceMesh,
      verificationPhase,
      verifyFace,
    ])

  /*
   * Load the current user's enrollment
   * and Human recognition engine.
   */
  useEffect(() => {
    let active = true

    cancelledRef.current = false

    async function initializeHuman() {
      try {
        setLoading(true)

        setCameraError('')

        setVerificationPhase(
          'loading',
        )

        setInstruction(
          'Loading face-recognition engine...',
        )

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          router.push('/login')
          return
        }

        const {
          data: enrollment,
          error: enrollmentError,
        } =
          await supabase
            .from(
              'face_enrollments',
            )
            .select(
              'face_template, sample_count',
            )
            .eq(
              'user_id',
              user.id,
            )
            .maybeSingle()

        if (enrollmentError) {
          throw enrollmentError
        }

        const embeddings =
          enrollment
            ?.face_template
            ?.embeddings

        if (
          !Array.isArray(
            embeddings,
          ) ||
          embeddings.length < 3
        ) {
          throw new Error(
            'No compatible face-recognition enrollment was found. Please set up Face Authentication again.',
          )
        }

        enrollmentRef.current =
          enrollment.face_template

        const human =
          await createHuman()

        if (!active) {
          try {
            human.stop?.()
          } catch {}

          return
        }

        humanRef.current = human

        setModelReady(true)
        setHumanReady(true)
        setLoading(false)

        setVerificationPhase(
          'loading',
        )

        setInstruction(
          'Face-recognition engine ready. Click Start Camera & Scan when you are ready.',
        )
      } catch (error) {
        console.error(
          'Face recognition initialization failed:',
          error,
        )

        if (active) {
          setCameraError(
            error?.message ||
              'Unable to initialize face recognition.',
          )

          setLoading(false)

          setVerificationPhase(
            'failed',
          )
        }
      }
    }

    initializeHuman()

    return () => {
      active = false
    }
  }, [router, supabase])

  /*
   * Start camera only after Human is ready.
   */
  useEffect(() => {
    if (!humanReady) {
      return
    }

    if (cameraReady) {
      return
    }

    if (!cameraRequested) {
      return
    }

    if (cameraError) {
      return
    }

    let active = true

    async function initializeCamera() {
      try {
        await new Promise(
          (resolve) => {
            requestAnimationFrame(
              () => {
                requestAnimationFrame(
                  resolve,
                )
              },
            )
          },
        )

        if (!active) {
          return
        }

        let video =
          videoRef.current

        const waitStartedAt =
          performance.now()

        while (
          !video &&
          active &&
          performance.now() -
            waitStartedAt <
            5000
        ) {
          await new Promise(
            (resolve) => {
              requestAnimationFrame(
                resolve,
              )
            },
          )

          video =
            videoRef.current
        }

        if (!video) {
          throw new Error(
            'Camera element could not be mounted. Please refresh the page and try again.',
          )
        }

        if (
          !navigator
            .mediaDevices
            ?.getUserMedia
        ) {
          throw new Error(
            'Camera access is not supported by this browser.',
          )
        }

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                facingMode:
                  'user',

                width: {
                  ideal: 1280,
                },

                height: {
                  ideal: 720,
                },
              },

              audio: false,
            },
          )

        if (!active) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop(),
            )

          return
        }

        streamRef.current =
          stream

        video.srcObject =
          stream

        await new Promise(
          (resolve) => {
            if (
              video.readyState >=
              1
            ) {
              resolve()
              return
            }

            video.onloadedmetadata =
              resolve
          },
        )

        if (!active) {
          return
        }

        await video.play()

        if (!active) {
          return
        }

        setCameraReady(true)

        setVerificationPhase(
          'scanning',
        )

        nextCaptureAtRef.current =
          Date.now() + 1500

        setCountdown(2)

        setInstruction(
          'Look at the camera. Your face will be scanned automatically.',
        )

        runLoop()
      } catch (error) {
        console.error(
          'Camera initialization failed:',
          error,
        )

        if (active) {
          setCameraError(
            error?.message ||
              'Unable to access your camera.',
          )

          setCameraReady(false)

          setVerificationPhase(
            'failed',
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
    humanReady,
    cameraRequested,
    runLoop,
  ])

  const handleStartCamera = useCallback(() => {
    setCameraError('')
    setResult(null)
    setFinished(false)
    setFaceDetected(false)
    setFaceReady(false)
    setFaceScore(0)
    setScanCount(0)
    setCountdown(0)
    setBlinkDetected(false)
    setVerificationPhase('loading')
    setInstruction('Starting camera...')
    scanSamplesRef.current = []
    blinkDetectedRef.current = false
    stableSinceRef.current = null
    nextCaptureAtRef.current = 0
    cancelledRef.current = false
    setCameraRequested(true)
  }, [])

  const handleRetry = useCallback(() => {
    stopCamera()
    setCameraRequested(false)
    setCameraError('')
    setResult(null)
    setFinished(false)
    setFaceDetected(false)
    setFaceReady(false)
    setFaceScore(0)
    setScanCount(0)
    setCountdown(0)
    setBlinkDetected(false)
    setVerificationPhase('loading')
    setInstruction('Ready when you are. Click Start Camera & Scan to try again.')
    scanSamplesRef.current = []
    blinkDetectedRef.current = false
    stableSinceRef.current = null
    nextCaptureAtRef.current = 0
  }, [stopCamera])

  const stopEverything = useCallback(() => {
    stopCamera()
    try {
      humanRef.current?.stop?.()
    } catch {
      // Human may already be stopped.
    }
    humanRef.current = null
  }, [stopCamera])
  /*
   * Cleanup on page exit.
   */
  useEffect(() => {
    return () => {
      stopEverything()
    }
  }, [stopEverything])

  function handleCancel() {
    stopEverything()
    if (unlockMode) {
      supabase.auth.signOut().finally(() => router.replace('/login'))
      return
    }
    router.push('/dashboard/profile')
  }

  const progress =
    (scanCount / TOTAL_SCANS) * 100

  const phaseLabel =
    verificationPhase === 'loading'
      ? 'Loading scanner...'
      : verificationPhase ===
          'scanning'
        ? 'Scanning face...'
        : verificationPhase ===
            'analyzing'
          ? 'Analyzing identity...'
          : verificationPhase ===
              'verified'
            ? 'Identity verified'
            : verificationPhase ===
                'failed'
              ? 'Verification failed'
              : 'Face recognition ready'

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden p-2 pb-28 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!unlockMode && (
              <button
                type="button"
                onClick={handleCancel}
                className="mb-3 text-sm font-medium text-slate-500 transition hover:text-slate-800"
              >
                ← Back to Profile
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FaceIcon />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                  Face Verification
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Continuous face tracking and multi-scan identity verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {cameraError && (
          <Card className="mt-6 border-red-200 bg-red-50 p-5">
            <div className="flex gap-3">
              <div className="mt-0.5 text-red-600">
                <CameraIcon />
              </div>

              <div>
                <h2 className="font-semibold text-red-800">
                  Face verification unavailable
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

        {/* Main */}
        <div className="mt-3 grid gap-3 lg:mt-6 lg:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Camera */}
          <Card className="overflow-hidden p-1.5 sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950 sm:aspect-video">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  transform:
                    'scaleX(-1)',
                }}
              />

              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />

              <div className="pointer-events-none absolute inset-0">
                {/* Status */}
                <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
                  <div className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-xs">
                    {phaseLabel}
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] text-white backdrop-blur-md sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        faceDetected
                          ? 'bg-emerald-400'
                          : 'bg-amber-400'
                      }`}
                    />

                    {faceDetected
                      ? 'Face tracked'
                      : 'Searching'}
                  </div>
                </div>

                {/* Face guide */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`relative h-[72%] w-[62%] max-w-[280px] rounded-[48%] border-2 border-dashed transition-colors sm:h-[78%] sm:w-[48%] ${
                      faceReady
                        ? 'border-emerald-300'
                        : verificationPhase ===
                            'verified'
                          ? 'border-emerald-300'
                          : verificationPhase ===
                              'failed'
                            ? 'border-red-300'
                            : 'border-white/35'
                    }`}
                  >
                    <div className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-cyan-300" />

                    <div className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-cyan-300" />

                    <div className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-cyan-300" />

                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-cyan-300" />
                  </div>
                </div>

                {/* Instruction */}
                <div className="absolute bottom-3 left-2 right-2 flex justify-center sm:bottom-5 sm:left-4 sm:right-4">
                  <div className="max-w-xl rounded-2xl border border-white/15 bg-black/55 px-3 py-2.5 text-center text-xs font-semibold text-white shadow-xl backdrop-blur-md sm:px-5 sm:py-3 sm:text-base">
                    {instruction}

                    {countdown >
                      0 &&
                      verificationPhase ===
                        'scanning' &&
                      scanCount <
                        TOTAL_SCANS
                      ? ` ${countdown}s`
                      : ''}
                  </div>
                </div>
              </div>

              {/* Loading overlay */}
              {((loading || (cameraRequested && humanReady && !cameraReady))) &&
                !cameraError &&
                verificationPhase !==
                  'verified' &&
                verificationPhase !==
                  'failed' && (
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
                  className="min-h-12 w-full text-base"
                >
                  <CameraIcon className="mr-2 h-5 w-5" />
                  {loading
                    ? 'Preparing face recognition...'
                    : 'Start Camera & Scan'}
                </Button>
              </div>
            )}
            {/* Progress */}
            <div className="px-1 pb-1 pt-3 sm:pt-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  Verification Progress
                </p>

                <p className="text-sm font-bold text-indigo-600">
                  {Math.round(
                    progress,
                  )}
                  %
                </p>
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Identity panel */}
          <Card className="p-3 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <FaceIcon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Identity Check
                </h2>

                <p className="text-xs text-slate-500">
                  Continuous multi-scan verification
                </p>
              </div>
            </div>

            {/* Scan list */}
            <div className="mt-6 space-y-3">
              {Array.from(
                {
                  length:
                    TOTAL_SCANS,
                },
                (_, index) => {
                  const complete =
                    scanCount >
                    index

                  const active =
                    verificationPhase ===
                      'scanning' &&
                    scanCount ===
                      index &&
                    !finished

                  return (
                    <div
                      key={
                        index
                      }
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${
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
                          <span className="text-xs font-bold">
                            {index +
                              1}
                          </span>
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
                          Scan{' '}
                          {index +
                            1}
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
                },
              )}
            </div>

            {/* Scanner information */}
            <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-4 text-[11px] text-slate-500">
              <div className="flex justify-between gap-3">
                <span>
                  Face detected
                </span>

                <span className="font-semibold text-slate-700">
                  {faceDetected
                    ? 'Yes'
                    : 'No'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>
                  Face quality
                </span>

                <span className="font-semibold text-slate-700">
                  {faceScore
                    ? `${Math.round(
                        faceScore *
                          100,
                      )}%`
                    : 'Ã¢â‚¬â€'}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span>
                  Blink/liveness signal
                </span>

                <span
                  className={`font-semibold ${
                    blinkDetected
                      ? 'text-emerald-600'
                      : 'text-slate-700'
                  }`}
                >
                  {blinkDetected
                    ? 'Detected'
                    : 'Waiting'}
                </span>
              </div>
            </div>

            {/* Analyzing */}
            {finished &&
              !result && (
                <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                      <FaceIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-indigo-800">
                        Analyzing identity...
                      </p>

                      <p className="mt-1 text-xs leading-relaxed text-indigo-700">
                        Comparing multiple face embeddings and checking liveness.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="primary"
                      disabled
                      className="min-h-12 w-full text-base"
                    >
                      {verifying
                        ? 'Verifying...'
                        : 'Analyzing...'}
                    </Button>
                  </div>
                </div>
              )}

            {/* Result */}
            {result && (
              <div
                className={`mt-6 rounded-2xl border p-4 ${
                  result.matched
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
                      result.matched
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {result.matched ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span className="text-lg font-bold">
                        !
                      </span>
                    )}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-bold ${
                        result.matched
                          ? 'text-emerald-800'
                          : 'text-red-800'
                      }`}
                    >
                      {result.matched
                        ? 'Face Verified'
                        : 'Face Not Recognized'}
                    </p>

                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        result.matched
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }`}
                    >
                      {result.message}
                    </p>

                    {result.comparison && (
                      <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                        <p>
                          Matching scans:{' '}
                          <strong>
                            {
                              result
                                .comparison
                                .matchedCount
                            }
                            /
                            {
                              result
                                .comparison
                                .scanCount
                            }
                          </strong>
                        </p>

                        <p>
                          Average similarity:{' '}
                          <strong>
                            {Math.round(
                              result
                                .comparison
                                .averageSimilarity *
                                100,
                            )}
                            %
                          </strong>
                        </p>

                        <p>
                          Best similarity:{' '}
                          <strong>
                            {Math.round(
                              result
                                .comparison
                                .bestSimilarity *
                                100,
                            )}
                            %
                          </strong>
                        </p>

                        <p>
                          Liveness:{' '}
                          <strong>
                            {result
                              .comparison
                              .livePassed
                              ? 'Passed'
                              : 'Not passed'}
                          </strong>
                        </p>

                        <p>
                          Blink:{' '}
                          <strong>
                            {result
                              .comparison
                              .blinkDetected
                              ? 'Detected'
                              : 'Not detected'}
                          </strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {!result.matched && (
                    <Button
                      onClick={handleRetry}
                      className="mb-3 w-full"
                    >
                      Try Again
                    </Button>
                  )}

                  {!unlockMode && (
                    <Button
                      variant="secondary"
                      onClick={() => router.push('/dashboard/profile')}
                      className="min-h-12 w-full text-base"
                    >
                      Back to Profile
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!finished && (
              <div className="mt-6">
                <Button
                  variant="secondary"
                  onClick={
                    handleCancel
                  }
                  className="min-h-12 w-full text-base"
                >
                  Cancel
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Information */}
        <Card className="mt-6 border-slate-200 bg-slate-50 p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
              <FaceIcon className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                About this verification
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                The browser continuously tracks one face, captures five recognition embeddings about three seconds apart, and checks multiple samples plus liveness signals before returning a result. This is a prototype biometric system and should not be treated as the sole high-security authentication factor.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function FaceVerificationPage(props) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-sm text-white">
          Loading face verification...
        </main>
      }
    >
      <FaceVerificationContent {...props} />
    </Suspense>
  )
}





