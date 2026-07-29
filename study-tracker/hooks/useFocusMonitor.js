'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { loadMediaPipeVision } from '@/lib/loadMediaPipe'
import { logFocusEvent } from '@/lib/focusEvents'

/**
 * Browser-only focus monitoring via MediaPipe. No frames are uploaded.
 *
 * Reasons: 'phone_detected' | 'no_body' | 'not_writing' | 'not_looking'
 */

const SAMPLE_INTERVAL_MS = 2000
const CONFIRM_TICKS = 2
const STILL_HAND_THRESHOLD_MS = 7 * 60 * 1000
const INACTIVITY_THRESHOLD_MS = 10 * 1000
const HAND_MOVE_EPSILON = 0.015
const BODY_MOVE_EPSILON = 0.012

async function safePlay(video) {
  try {
    await video.play()
  } catch (err) {
    if (err?.name !== 'AbortError') throw err
    await new Promise((resolve) => requestAnimationFrame(resolve))
    try {
      await video.play()
    } catch (retryErr) {
      if (retryErr?.name !== 'AbortError') throw retryErr
    }
  }
}

function landmarkMoved(prev, next, epsilon) {
  if (!prev || !next) return true
  return Math.hypot(next.x - prev.x, next.y - prev.y) > epsilon
}

/** Estimate whether the student is looking toward the camera (front cam only). */
function isLookingAtCamera(landmarks) {
  if (!landmarks?.length) return false

  const nose = landmarks[1]
  const leftEye = landmarks[33]
  const rightEye = landmarks[263]
  if (!nose || !leftEye || !rightEye) return false

  const eyeMidX = (leftEye.x + rightEye.x) / 2
  const eyeWidth = Math.abs(rightEye.x - leftEye.x) || 0.01
  const noseOffset = (nose.x - eyeMidX) / eyeWidth

  const eyeMidY = (leftEye.y + rightEye.y) / 2
  const verticalRatio = (nose.y - eyeMidY) / eyeWidth

  if (Math.abs(noseOffset) > 0.35) return false
  if (verticalRatio < 0.15 || verticalRatio > 1.3) return false

  return true
}

export function useFocusMonitor({
  sessionId,
  userId,
  enabled,
  videoRef,
  facingMode = 'user',
  onInactivity,
}) {
  const internalVideoRef = useRef(null)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const inactivityFiredRef = useRef(false)

  const detectorsRef = useRef({ object: null, pose: null, hand: null, face: null })

  const currentReasonRef = useRef(null)
  const distractionStartRef = useRef(null)
  const pendingReasonRef = useRef(null)
  const pendingCountRef = useRef(0)

  const lastHandPosRef = useRef(null)
  const lastHandMoveAtRef = useRef(Date.now())
  const lastBodyPosRef = useRef(null)
  const lastBodyMoveAtRef = useRef(Date.now())

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeDistraction, setActiveDistraction] = useState(null)

  const getVideoEl = useCallback(() => {
    return videoRef?.current ?? internalVideoRef.current
  }, [videoRef])

  const loadModels = useCallback(async (includeFace) => {
    const { FilesetResolver, ObjectDetector, PoseLandmarker, HandLandmarker, FaceLandmarker } =
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

    if (includeFace) {
      detectorsRef.current.face = await createWithFallback((delegate) =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate,
          },
          runningMode: 'IMAGE',
          numFaces: 1,
        })
      )
    } else {
      detectorsRef.current.face = null
    }
  }, [])

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    const video = getVideoEl()
    if (video) video.srcObject = null
  }, [getVideoEl])

  const startCamera = useCallback(async () => {
    const video = getVideoEl()
    if (!video) throw new Error('Video element not available')

    stopStream()

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    })
    streamRef.current = stream
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    await safePlay(video)
  }, [getVideoEl, facingMode, stopStream])

  const checkInactivity = useCallback(
    (now, bodyPresent, handPresent, poseLandmarks, handLandmarks) => {
      let moved = false

      if (bodyPresent && poseLandmarks?.length) {
        const nose = poseLandmarks[0]
        const pos = { x: nose.x, y: nose.y }
        if (landmarkMoved(lastBodyPosRef.current, pos, BODY_MOVE_EPSILON)) moved = true
        lastBodyPosRef.current = pos
      }

      if (handPresent && handLandmarks?.length) {
        const wrist = handLandmarks[0]
        const pos = { x: wrist.x, y: wrist.y }
        if (landmarkMoved(lastHandPosRef.current, pos, HAND_MOVE_EPSILON)) {
          moved = true
          lastHandMoveAtRef.current = now
        }
        lastHandPosRef.current = pos
      }

      if (moved) {
        lastBodyMoveAtRef.current = now
        inactivityFiredRef.current = false
      } else if (now - lastBodyMoveAtRef.current >= INACTIVITY_THRESHOLD_MS && !inactivityFiredRef.current) {
        inactivityFiredRef.current = true
        onInactivity?.()
      }
    },
    [onInactivity]
  )

  const classifyTick = useCallback(() => {
    const video = getVideoEl()
    const { object, pose, hand, face } = detectorsRef.current
    if (!video || video.readyState < 2 || !object || !pose || !hand) return null

    const now = Date.now()
    const useFrontCamera = facingMode === 'user'

    const objResult = object.detect(video)
    const phoneVisible = objResult.detections.length > 0

    const poseResult = pose.detect(video)
    const bodyPresent = poseResult.landmarks.length > 0
    const poseLandmarks = bodyPresent ? poseResult.landmarks[0] : null

    const handResult = hand.detect(video)
    const handPresent = handResult.landmarks.length > 0
    const handLandmarks = handPresent ? handResult.landmarks[0] : null

    checkInactivity(now, bodyPresent, handPresent, poseLandmarks, handLandmarks)

    let handStillLong = false
    if (handPresent) {
      handStillLong = now - lastHandMoveAtRef.current >= STILL_HAND_THRESHOLD_MS
    } else {
      handStillLong = now - lastHandMoveAtRef.current >= STILL_HAND_THRESHOLD_MS
    }

    if (phoneVisible) return 'phone_detected'

    if (useFrontCamera && face) {
      const faceResult = face.detect(video)
      const faceLandmarks = faceResult.faceLandmarks?.[0]
      if (!faceLandmarks || !isLookingAtCamera(faceLandmarks)) {
        return 'not_looking'
      }
    }

    if (!bodyPresent) return 'no_body'
    if (handStillLong) return 'not_writing'
    return null
  }, [getVideoEl, facingMode, checkInactivity])

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

    inactivityFiredRef.current = false
    lastHandMoveAtRef.current = Date.now()
    lastBodyMoveAtRef.current = Date.now()
    lastHandPosRef.current = null
    lastBodyPosRef.current = null

    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)
        await loadModels(facingMode === 'user')
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
      stopStream()
      if (currentReasonRef.current) finalizeDistraction(Date.now())
    }
  }, [
    enabled,
    sessionId,
    userId,
    facingMode,
    loadModels,
    startCamera,
    tick,
    finalizeDistraction,
    stopStream,
  ])

  return { isLoading, error, activeDistraction }
}
