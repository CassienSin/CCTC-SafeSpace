const HUMAN_VERSION = '3.3.6'

const HUMAN_SCRIPT_ID = 'cctc-human-browser-runtime'

const HUMAN_SCRIPT_SRC =
  `https://cdn.jsdelivr.net/npm/@vladmandic/human@${HUMAN_VERSION}/dist/human.js`

const MODEL_BASE_PATH =
  'https://vladmandic.github.io/human-models/models/'

let humanConstructorPromise = null

/*
 * Human similarity settings.
 *
 * These are the matching options used when comparing
 * face-recognition embeddings.
 */
export const MATCH_OPTIONS = {
  order: 2,
  multiplier: 25,
  min: 0.2,
  max: 0.8,
}

/*
 * Human browser configuration.
 *
 * Face recognition:
 * - detector: finds and tracks the face
 * - mesh: facial mesh/landmarks
 * - iris: eye/iris tracking
 * - description: generates the face embedding
 * - antispoof: estimates whether the face is a real face
 * - liveness: estimates whether the face is live
 * - gesture: detects actions such as blinking
 */
export const HUMAN_CONFIG = {
  backend: 'webgl',
  async: true,

  cacheSensitivity: 0.01,

  modelBasePath: MODEL_BASE_PATH,

  filter: {
    enabled: true,
    equalization: true,
    flip: false,
  },

  debug: false,

  face: {
    enabled: true,

    detector: {
      rotation: true,
      return: true,
      mask: false,
      maxDetected: 1,
      minConfidence: 0.6,
    },

    mesh: {
      enabled: true,
    },

    iris: {
      enabled: true,
    },

    description: {
      enabled: true,
    },

    antispoof: {
      enabled: true,
    },

    liveness: {
      enabled: true,
    },
  },

  body: {
    enabled: false,
  },

  hand: {
    enabled: false,
  },

  object: {
    enabled: false,
  },

  gesture: {
    enabled: true,
  },

  segmentation: {
    enabled: false,
  },
}

/*
 * Dynamically load the browser version of Human.
 *
 * We intentionally do NOT import @vladmandic/human
 * statically because Next.js/Turbopack can resolve
 * the Node bundle, which expects @tensorflow/tfjs-node.
 */
function loadHumanBrowserRuntime() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return Promise.reject(
      new Error(
        'The Human face-recognition engine can only run in a browser.',
      ),
    )
  }

  if (window.Human) {
    return Promise.resolve(window.Human)
  }

  if (humanConstructorPromise) {
    return humanConstructorPromise
  }

  humanConstructorPromise = new Promise(
    (resolve, reject) => {
      const existing =
        document.getElementById(HUMAN_SCRIPT_ID)

      const handleLoad = () => {
        if (window.Human) {
          resolve(window.Human)
          return
        }

        humanConstructorPromise = null

        reject(
          new Error(
            'Human loaded, but the browser runtime did not expose window.Human.',
          ),
        )
      }

      const handleError = () => {
        humanConstructorPromise = null

        reject(
          new Error(
            'The Human face-recognition runtime could not be loaded. Check your internet connection or CDN access.',
          ),
        )
      }

      if (existing) {
        if (window.Human) {
          handleLoad()
          return
        }

        if (existing.readyState === 'complete') {
          humanConstructorPromise = null
          reject(new Error('The Human browser runtime finished loading without exposing window.Human.'))
          return
        }
        existing.addEventListener(
          'load',
          handleLoad,
          { once: true },
        )

        existing.addEventListener(
          'error',
          handleError,
          { once: true },
        )

        /*
         * If the script was already inserted and has
         * already completed loading, check immediately.
         */
        if (window.Human) {
          handleLoad()
        }

        return
      }

      const script =
        document.createElement('script')

      script.id = HUMAN_SCRIPT_ID
      script.src = HUMAN_SCRIPT_SRC
      script.async = true
      script.crossOrigin = 'anonymous'

      script.onload = handleLoad
      script.onerror = handleError

      document.head.appendChild(script)
    },
  )

  return humanConstructorPromise
}

/*
 * Create and initialize a Human instance.
 */
export async function createHuman() {
  const runtime =
    await loadHumanBrowserRuntime()

  /*
   * Depending on how the browser bundle exposes
   * itself, the constructor may be:
   *
   * window.Human.Human
   * window.Human.default
   * or window.Human
   */
  const HumanConstructor =
    runtime?.Human ??
    runtime?.default ??
    runtime

  if (
    typeof HumanConstructor !== 'function'
  ) {
    console.error(
      'Unexpected Human browser runtime:',
      runtime,
    )

    throw new Error(
      'The Human browser runtime loaded, but its constructor could not be found.',
    )
  }

  const human =
    new HumanConstructor(HUMAN_CONFIG)

  await human.load()

  if (typeof human.detect !== 'function' || typeof human.match?.similarity !== 'function') {
    throw new Error('The Human face-recognition engine initialized without its required APIs.')
  }

  return human
}

/*
 * Convert a numeric value into an absolute degree value.
 */
function radiansToDegrees(value) {
  return Math.abs(
    (Number(value || 0) * 180) /
      Math.PI,
  )
}

/*
 * Get face quality information used by both
 * enrollment and verification.
 */
export function getFaceStatus(face, video) {
  if (!face) {
    return {
      ok: false,
      reason: 'No face detected',
      faceScore: 0,
      real: 0,
      live: 0,
      yawDegrees: 0,
      pitchDegrees: 0,
      rollDegrees: 0,
      relativeSize: 0,
    }
  }

  /*
   * Human exposes the detection confidence using
   * faceScore. Keep fallbacks for compatibility.
   */
  const faceScore = Number(
    face.faceScore ??
      face.boxScore ??
      face.score ??
      0,
  )

  /*
   * Anti-spoof and liveness values.
   */
  const real = Number(
    face.real ?? 0,
  )

  const live = Number(
    face.live ?? 0,
  )

  /*
   * Face size relative to the camera frame.
   */
  const [width = 0, height = 0] =
    Array.isArray(face.size)
      ? face.size
      : [0, 0]

  const videoWidth =
    video?.videoWidth || 1

  const videoHeight =
    video?.videoHeight || 1

  const relativeSize =
    Math.min(
      width / videoWidth,
      height / videoHeight,
    )

  /*
   * Head rotation.
   */
  const rotation =
    face.rotation?.angle

  const yaw =
    rotation?.yaw ?? 0

  const pitch =
    rotation?.pitch ?? 0

  const roll =
    rotation?.roll ?? 0

  const yawDegrees =
    radiansToDegrees(yaw)

  const pitchDegrees =
    radiansToDegrees(pitch)

  const rollDegrees =
    radiansToDegrees(roll)

  /*
   * Face detection confidence.
   */
  if (faceScore < 0.6) {
    return {
      ok: false,
      reason:
        'Hold still and keep your face clearly visible',
      faceScore,
      real,
      live,
      yawDegrees,
      pitchDegrees,
      rollDegrees,
      relativeSize,
    }
  }

  /*
   * Face is too small for reliable recognition.
   */
  if (relativeSize < 0.16) {
    return {
      ok: false,
      reason:
        'Move a little closer to the camera',
      faceScore,
      real,
      live,
      yawDegrees,
      pitchDegrees,
      rollDegrees,
      relativeSize,
    }
  }

  /*
   * Keep the user's face reasonably centered.
   *
   * We allow natural movement because this is a
   * continuously tracked system rather than a
   * rigid head-position challenge.
   */
  if (
    yawDegrees > 28 ||
    pitchDegrees > 24 ||
    rollDegrees > 20
  ) {
    return {
      ok: false,
      reason:
        'Look toward the camera',
      faceScore,
      real,
      live,
      yawDegrees,
      pitchDegrees,
      rollDegrees,
      relativeSize,
    }
  }

  /*
   * Human must have generated the recognition
   * embedding before the frame can be used.
   */
  if (
    !Array.isArray(face.embedding) ||
    face.embedding.length === 0
  ) {
    return {
      ok: false,
      reason:
        'Face embedding is not ready yet',
      faceScore,
      real,
      live,
      yawDegrees,
      pitchDegrees,
      rollDegrees,
      relativeSize,
    }
  }

  return {
    ok: true,
    reason: 'Face ready',

    faceScore,
    real,
    live,

    yawDegrees,
    pitchDegrees,
    rollDegrees,

    relativeSize,
  }
}

/*
 * Detect a natural blink from Human's gesture output.
 *
 * Human can report:
 * - blink left eye
 * - blink right eye
 */
export function hasBlink(result) {
  const gestures = Array.isArray(
    result?.gesture,
  )
    ? result.gesture
    : []

  return gestures.some((entry) => {
    const value = String(
      entry?.gesture || '',
    ).toLowerCase()

    return (
      value.includes(
        'blink left eye',
      ) ||
      value.includes(
        'blink right eye',
      )
    )
  })
}
