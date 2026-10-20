'use client'

import { useEffect, useRef } from 'react'
import { FACE_CONNECTIONS } from '@/lib/face/meshConnections'

// Draw the same tracked 468-point face mesh used by the existing profile
// scanner. This runs locally for the preview; the pilot still validates
// captured frames and identity on its server route.
export default function FaceLandmarkOverlay({ videoRef, active, prompt }) {
  const canvasRef = useRef(null)
  const promptRef = useRef(prompt)
  promptRef.current = prompt

  useEffect(() => {
    if (!active) return undefined

    let cancelled = false
    let timer = null
    let human = null

    function clear() {
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
    }

    function draw(face) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const mesh = face?.meshRaw
      if (!canvas || !video || !Array.isArray(mesh) || mesh.length < 468
        || !video.videoWidth || !video.videoHeight) {
        clear()
        return
      }

      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.floor(rect.width * dpr))
      const height = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.clearRect(0, 0, rect.width, rect.height)

      // Match object-fit: contain and the mirrored selfie preview.
      const scale = Math.min(rect.width / video.videoWidth, rect.height / video.videoHeight)
      const offsetX = (rect.width - video.videoWidth * scale) / 2
      const offsetY = (rect.height - video.videoHeight * scale) / 2
      const point = (index) => {
        const raw = mesh[index]
        if (!Array.isArray(raw) || raw.length < 2 || !Number.isFinite(raw[0]) || !Number.isFinite(raw[1])) return null
        return {
          x: offsetX + (1 - raw[0]) * video.videoWidth * scale,
          y: offsetY + raw[1] * video.videoHeight * scale,
        }
      }

      const yaw = face.rotation?.angle?.yaw
      const pitch = face.rotation?.angle?.pitch
      const currentPrompt = promptRef.current
      const poseReady = Number.isFinite(yaw) && Number.isFinite(pitch) && Math.abs(pitch) <= 0.45 && (
        currentPrompt === 'left' ? yaw > 0.12 && yaw < 0.65
          : currentPrompt === 'right' ? yaw < -0.12 && yaw > -0.65
            : ['front', 'blink'].includes(currentPrompt) && Math.abs(yaw) < 0.3
      )
      const live = poseReady && Number(face.real ?? 0) >= 0.6 && Number(face.live ?? 0) >= 0.6
      const accent = live ? '52, 211, 153' : '56, 189, 248'
      context.lineCap = 'round'
      context.lineJoin = 'round'

      context.save()
      context.lineWidth = 4.5
      context.strokeStyle = `rgba(${accent}, 0.14)`
      context.shadowColor = `rgba(${accent}, 0.9)`
      context.shadowBlur = 14
      for (const [startIndex, endIndex] of FACE_CONNECTIONS) {
        const start = point(startIndex), end = point(endIndex)
        if (!start || !end) continue
        context.beginPath()
        context.moveTo(start.x, start.y)
        context.lineTo(end.x, end.y)
        context.stroke()
      }
      context.restore()

      context.lineWidth = 1.25
      context.strokeStyle = `rgba(${accent}, 0.9)`
      context.shadowColor = `rgba(${accent}, 0.9)`
      context.shadowBlur = 5
      const landmarks = new Map()
      for (const [startIndex, endIndex] of FACE_CONNECTIONS) {
        const start = point(startIndex), end = point(endIndex)
        if (!start || !end) continue
        landmarks.set(startIndex, start)
        landmarks.set(endIndex, end)
        context.beginPath()
        context.moveTo(start.x, start.y)
        context.lineTo(end.x, end.y)
        context.stroke()
      }

      context.fillStyle = `rgba(${accent}, 0.95)`
      context.shadowBlur = 8
      for (const { x, y } of landmarks.values()) {
        context.beginPath()
        context.arc(x, y, 1.7, 0, Math.PI * 2)
        context.fill()
      }
    }

    async function tick() {
      if (cancelled) return
      const video = videoRef.current
      if (!human || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        timer = setTimeout(tick, 120)
        return
      }
      try {
        const result = await human.detect(video)
        if (cancelled) return
        const faces = Array.isArray(result?.face) ? result.face : []
        if (faces.length === 1) draw(faces[0])
        else clear()
      } catch {
        clear()
      }
      if (!cancelled) timer = setTimeout(tick, 90)
    }

    async function initialize() {
      try {
        const { createHuman } = await import('@/lib/face/humanClient')
        const instance = await createHuman()
        if (cancelled) {
          instance.stop?.()
          return
        }
        human = instance
        tick()
      } catch {
        // The camera scan continues if local preview tracking cannot load.
        clear()
      }
    }

    initialize()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      try { human?.stop?.() } catch {}
      clear()
    }
  }, [active, videoRef])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
}
