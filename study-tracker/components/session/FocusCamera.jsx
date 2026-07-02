'use client'

import { useEffect, useRef, useState } from 'react'

const STUDENT_ID = 'cccccccc-0000-0000-0000-000000000001'
const POLL_INTERVAL_MS = 5000
const DEFAULT_ESTIMATED_SECONDS = 180

export default function FocusCamera({
  videoRef,
  screenVideoRef,
  sessionId,
  estimatedSecondsPerQuestion = DEFAULT_ESTIMATED_SECONDS,
}) {
  const camCanvasRef     = useRef(null)
  const screenCanvasRef  = useRef(null)
  const [focusStatus, setFocusStatus]         = useState('focused')
  const [countdown, setCountdown]             = useState(null)
  const [distractReason, setDistractReason]   = useState(null)

  const currentQuestionRef  = useRef(null)
  const questionStartRef    = useRef(null)
  const loggedStuckRef      = useRef(new Set())

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (error) {
        console.error('Error accessing webcam:', error)
      }
    }
    setupCamera()
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

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
          userId:           STUDENT_ID,
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

  useEffect(() => {
    const interval = setInterval(async () => {
      const camVideo     = videoRef.current
      const camCanvas    = camCanvasRef.current
      const screenVideo  = screenVideoRef?.current
      const screenCanvas = screenCanvasRef.current

      if (!camVideo || !camCanvas || camVideo.readyState < 2) return

      camCanvas.getContext('2d').drawImage(camVideo, 0, 0, camCanvas.width, camCanvas.height)
      const camFrame = camCanvas.toDataURL('image/jpeg').split(',')[1]

      let screenFrame = null
      const screenSharing = screenVideo?.srcObject && screenVideo.readyState >= 2
      if (screenSharing && screenCanvas) {
        screenCanvas.getContext('2d').drawImage(screenVideo, 0, 0, screenCanvas.width, screenCanvas.height)
        screenFrame = screenCanvas.toDataURL('image/jpeg').split(',')[1]
      }

      try {
        const res = await fetch('/api/focus/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id':    STUDENT_ID,
          },
          body: JSON.stringify({
            frame:       camFrame,
            sessionId,
            ...(screenFrame && { screenFrame }),
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        if (!data.focused) {
          setFocusStatus('distracted')
          setDistractReason(data.reason)
          setCountdown(prev => prev === null ? 10 : prev)
        } else {
          setFocusStatus('focused')
          setDistractReason(null)
          setCountdown(null)
        }

        if (screenSharing && data.currentQuestion) {
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
        console.error('Focus API error:', err)
      }
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      const prev = currentQuestionRef.current
      const start = questionStartRef.current
      if (prev != null && start != null) {
        const elapsed = Math.round((Date.now() - start) / 1000)
        logQuestionTime(prev, elapsed)
      }
    }
  }, [sessionId, estimatedSecondsPerQuestion])

  useEffect(() => {
    if (countdown === null || countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const reasonLabel = {
    phone_detected:   'Phone detected',
    not_writing:      'Not reading or writing',
    talking:          'Talking detected',
    off_task_screen:  'Screen looks off-task',
  }

  return (
    <>
      <canvas ref={camCanvasRef}    width={640} height={480} className="hidden" />
      <canvas ref={screenCanvasRef} width={640} height={480} className="hidden" />

      {focusStatus === 'distracted' && countdown !== null && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm font-medium px-5 py-3 rounded-2xl shadow-lg animate-bounce">
          <span>⚠️</span>
          <span>{reasonLabel[distractReason] ?? 'Stay focused!'}</span>
          <span className="ml-2 bg-yellow-200 text-yellow-900 font-bold px-2 py-0.5 rounded-full text-xs">
            {countdown}s
          </span>
        </div>
      )}
    </>
  )
}
