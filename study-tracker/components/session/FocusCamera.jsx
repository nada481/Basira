'use client'

import { useEffect, useRef, useState } from 'react'
import { useFocusMonitor } from '@/hooks/useFocusMonitor'
import { DEMO_STUDENT_ID } from '@/lib/demoUsers'

const SCREEN_POLL_MS = 5000
const DEFAULT_ESTIMATED_SECONDS = 180

const REASON_LABELS = {
  phone_detected:  'Phone detected',
  no_body:         'Not at desk',
  not_writing:     'Not reading or writing',
  talking:         'Talking detected',
  off_task_screen: 'Screen looks off-task',
}

export default function FocusCamera({
  videoRef,
  screenVideoRef,
  sessionId,
  userId = DEMO_STUDENT_ID,
  enabled = true,
  estimatedSecondsPerQuestion = DEFAULT_ESTIMATED_SECONDS,
}) {
  const screenCanvasRef = useRef(null)
  const [screenDistraction, setScreenDistraction] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const currentQuestionRef = useRef(null)
  const questionStartRef = useRef(null)
  const loggedStuckRef = useRef(new Set())

  const { activeDistraction, isLoading, error: monitorError } = useFocusMonitor({
    sessionId,
    userId,
    enabled,
    videoRef,
  })

  async function logQuestionTime(questionNumber, timeSpentSeconds) {
    if (!sessionId || questionNumber == null) return

    const key = String(questionNumber)
    const isStuck = timeSpentSeconds >= estimatedSecondsPerQuestion
    if (isStuck && loggedStuckRef.current.has(key)) return

    try {
      await fetch('/api/page-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          questionNumber,
          timeSpentSeconds,
          estimatedSeconds: estimatedSecondsPerQuestion,
        }),
      })
      if (isStuck) loggedStuckRef.current.add(key)
    } catch (err) {
      console.error('Page tracking error:', err)
    }
  }

  function switchQuestion(newQuestion) {
    const prev = currentQuestionRef.current
    const start = questionStartRef.current

    if (prev != null && start != null) {
      const elapsed = Math.round((Date.now() - start) / 1000)
      logQuestionTime(prev, elapsed)
    }

    currentQuestionRef.current = newQuestion
    questionStartRef.current = newQuestion != null ? Date.now() : null
  }

  // Gemini screen-share analysis (off-task screen + question tracking)
  useEffect(() => {
    if (!enabled || !sessionId) return

    const interval = setInterval(async () => {
      const screenVideo = screenVideoRef?.current
      const screenCanvas = screenCanvasRef.current
      const screenSharing = screenVideo?.srcObject && screenVideo.readyState >= 2

      if (!screenSharing || !screenCanvas) {
        setScreenDistraction(null)
        return
      }

      screenCanvas.getContext('2d').drawImage(screenVideo, 0, 0, screenCanvas.width, screenCanvas.height)
      const screenFrame = screenCanvas.toDataURL('image/jpeg').split(',')[1]

      let camFrame = null
      const camVideo = videoRef?.current
      if (camVideo?.readyState >= 2) {
        const camCanvas = document.createElement('canvas')
        camCanvas.width = 640
        camCanvas.height = 480
        camCanvas.getContext('2d').drawImage(camVideo, 0, 0, camCanvas.width, camCanvas.height)
        camFrame = camCanvas.toDataURL('image/jpeg').split(',')[1]
      }

      try {
        const res = await fetch('/api/focus/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({
            frame: camFrame,
            screenFrame,
            sessionId,
            screenOnly: true,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        if (!data.focused && (data.reason === 'off_task_screen' || data.reason === 'talking')) {
          setScreenDistraction(data.reason)
        } else {
          setScreenDistraction(null)
        }

        if (data.currentQuestion) {
          const q = data.currentQuestion
          if (q !== currentQuestionRef.current) {
            switchQuestion(q)
          } else if (questionStartRef.current) {
            const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
            if (elapsed >= estimatedSecondsPerQuestion) {
              logQuestionTime(q, elapsed)
            }
          }
        }
      } catch (err) {
        console.error('Screen focus API error:', err)
      }
    }, SCREEN_POLL_MS)

    return () => {
      clearInterval(interval)
      const prev = currentQuestionRef.current
      const start = questionStartRef.current
      if (prev != null && start != null) {
        const elapsed = Math.round((Date.now() - start) / 1000)
        logQuestionTime(prev, elapsed)
      }
    }
  }, [enabled, sessionId, userId, estimatedSecondsPerQuestion, screenVideoRef, videoRef])

  const distractReason = screenDistraction ?? activeDistraction

  useEffect(() => {
    if (distractReason) setCountdown((prev) => (prev === null ? 10 : prev))
    else setCountdown(null)
  }, [distractReason])

  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <>
      <canvas ref={screenCanvasRef} width={640} height={480} className="hidden" />

      {isLoading && (
        <div className="fixed bottom-4 right-4 z-40 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
          Loading focus monitor…
        </div>
      )}

      {monitorError && (
        <div className="fixed bottom-4 right-4 z-40 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg shadow-sm max-w-xs">
          Focus monitor: {monitorError}
        </div>
      )}

      {distractReason && countdown !== null && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm font-medium px-5 py-3 rounded-2xl shadow-lg animate-bounce">
          <span>⚠️</span>
          <span>{REASON_LABELS[distractReason] ?? 'Stay focused!'}</span>
          <span className="ml-2 bg-yellow-200 text-yellow-900 font-bold px-2 py-0.5 rounded-full text-xs">
            {countdown}s
          </span>
        </div>
      )}
    </>
  )
}
