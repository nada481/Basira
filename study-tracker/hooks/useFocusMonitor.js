'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { loadMediaPipeVision } from '@/lib/loadMediaPipe'
import { logFocusEvent } from '@/lib/focusEvents'

/**
 * Browser-only focus monitoring via MediaPipe. No frames are uploaded.
 * Logs distraction periods to the DB through /api/focus/events.
 *
 * Reasons: 'phone_detected' | 'no_body' | 'not_writing'
 */

const SAMPLE_INTERVAL_MS = 2000
const CONFIRM_TICKS = 2
const STILL_HAND_THRESHOLD_MS = 7 * 60 * 1000
const HAND_MOVE_EPSILON = 0.015

export function useFocusMonitor({ sessionId, userId, enabled, videoRef }) {
  const internalVideoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)

  const detectorsRef = useRef({ object: null, pose: null, hand: null })

  const currentReasonRef = useRef(null)
  const distractionStartRef = useRef(null)
  const pendingReasonRef = useRef(null)
  const pendingCountRef = useRef(0)

  const lastHandPosRef = useRef(null)
  const lastHandMoveAtRef = useRef(Date.now())

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeDistraction, setActiveDistraction] = useState(null)

  const getVideoEl = useCallback(() => {
    return videoRef?.current ?? internalVideoRef.current
  }, [videoRef])

  const loadModels = useCallback(async () => {
    const { FilesetResolver, ObjectDetector, PoseLandmarker, HandLandmarker } =
      await loadMediaPipeVision()

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )

    const createWithFallback = async (factory) => {
      try {
        return await factory('GPU')
      } catch {
        return await factory('CPU')
      }
    }

    detectorsRef.current.object = await createWithFallback((delegate) =>
      ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
          delegate,
        },
        scoreThreshold: 0.5,
        runningMode: 'IMAGE',
        categoryAllowlist: ['cell phone'],
      })
    )

    detectorsRef.current.pose = await createWithFallback((delegate) =>
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate,
        },
        runningMode: 'IMAGE',
        numPoses: 1,
      })
    )

    detectorsRef.current.hand = await createWithFallback((delegate) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate,
        },
        runningMode: 'IMAGE',
        numHands: 1,
      })
    )
  }, [])

  const startCamera = useCallback(async () => {
    const video = getVideoEl()
    if (!video) throw new Error('Video element not available')

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: false,
    })
    streamRef.current = stream
    video.srcObject = stream
    video.muted = true
    await video.play()
  }, [getVideoEl])

  const classifyTick = useCallback(() => {
    const video = getVideoEl()
    const { object, pose, hand } = detectorsRef.current
    if (!video || video.readyState < 2 || !object || !pose || !hand) return null

    const now = Date.now()

    const objResult = object.detect(video)
    const phoneVisible = objResult.detections.length > 0

    const poseResult = pose.detect(video)
    const bodyPresent = poseResult.landmarks.length > 0

    const handResult = hand.detect(video)
    const handPresent = handResult.landmarks.length > 0

    let handStill = false
    if (handPresent) {
      const wrist = handResult.landmarks[0][0]
      const pos = { x: wrist.x, y: wrist.y }

      if (lastHandPosRef.current) {
        const dx = pos.x - lastHandPosRef.current.x
        const dy = pos.y - lastHandPosRef.current.y
        const moved = Math.hypot(dx, dy) > HAND_MOVE_EPSILON
        if (moved) lastHandMoveAtRef.current = now
      }
      lastHandPosRef.current = pos
      handStill = now - lastHandMoveAtRef.current >= STILL_HAND_THRESHOLD_MS
    } else {
      handStill = now - lastHandMoveAtRef.current >= STILL_HAND_THRESHOLD_MS
    }

    if (phoneVisible) return 'phone_detected'
    if (!bodyPresent) return 'no_body'
    if (handStill) return 'not_writing'
    return null
  }, [getVideoEl])

  const finalizeDistraction = useCallback(
    async (endTime) => {
      const reason = currentReasonRef.current
      const start = distractionStartRef.current
      if (!reason || !start) return

      const durationSeconds = Math.round((endTime - start) / 1000)
      currentReasonRef.current = null
      distractionStartRef.current = null
      setActiveDistraction(null)

      if (durationSeconds < 1 || !sessionId || !userId) return

      try {
        await logFocusEvent({
          sessionId,
          userId,
          reason,
          distractionDuration: durationSeconds,
          totalDistracted: durationSeconds,
          screenNote: null,
          screenFlagged: false,
        })
      } catch (err) {
        console.error('focus event log failed', err)
      }
    },
    [sessionId, userId]
  )

  const tick = useCallback(async () => {
    const detected = classifyTick()
    const now = Date.now()

    if (detected === currentReasonRef.current) {
      pendingReasonRef.current = null
      pendingCountRef.current = 0
      return
    }

    if (detected === pendingReasonRef.current) {
      pendingCountRef.current += 1
    } else {
      pendingReasonRef.current = detected
      pendingCountRef.current = 1
    }

    if (pendingCountRef.current < CONFIRM_TICKS) return

    if (currentReasonRef.current) {
      await finalizeDistraction(now)
    }
    if (detected) {
      currentReasonRef.current = detected
      distractionStartRef.current = now
      setActiveDistraction(detected)
    }
    pendingReasonRef.current = null
    pendingCountRef.current = 0
  }, [classifyTick, finalizeDistraction])

  useEffect(() => {
    if (!enabled || !sessionId || !userId) return
    let cancelled = false

    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        await loadModels()
        await startCamera()
        if (cancelled) return
        intervalRef.current = setInterval(tick, SAMPLE_INTERVAL_MS)
      } catch (err) {
        console.error('Focus monitor setup failed:', err)
        if (!cancelled) setError(err.message ?? 'Failed to start focus monitor')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      const video = getVideoEl()
      if (video) video.srcObject = null
      if (currentReasonRef.current) finalizeDistraction(Date.now())
    }
  }, [enabled, sessionId, userId, loadModels, startCamera, tick, finalizeDistraction, getVideoEl])

  return { isLoading, error, activeDistraction }
}
