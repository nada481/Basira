'use client'

import { useEffect, useRef, useState } from 'react'

export default function FocusCamera({ videoRef, screenVideoRef }) {
  const camCanvasRef    = useRef(null)
  const screenCanvasRef = useRef(null)
  const [focusStatus, setFocusStatus]     = useState('focused')
  const [countdown, setCountdown]         = useState(null)
  const [distractReason, setDistractReason] = useState(null)

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

  useEffect(() => {
    const interval = setInterval(() => {
      const camVideo     = videoRef.current
      const camCanvas    = camCanvasRef.current
      const screenVideo  = screenVideoRef?.current
      const screenCanvas = screenCanvasRef.current

      if (!camVideo || !camCanvas || camVideo.readyState < 2) return

      // Capture webcam frame
      camCanvas.getContext('2d').drawImage(camVideo, 0, 0, camCanvas.width, camCanvas.height)
      const camFrame = camCanvas.toDataURL('image/jpeg').split(',')[1]

      // Capture screen frame (only if screen share is active)
      let screenFrame = null
      if (
        screenVideo &&
        screenCanvas &&
        screenVideo.srcObject &&
        screenVideo.readyState >= 2
      ) {
        screenCanvas.getContext('2d').drawImage(screenVideo, 0, 0, screenCanvas.width, screenCanvas.height)
        screenFrame = screenCanvas.toDataURL('image/jpeg').split(',')[1]
      }

      fetch('/api/focus/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frame: camFrame,
          ...(screenFrame && { screenFrame }),
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (!data.focused) {
            setFocusStatus('distracted')
            setDistractReason(data.reason)
            setCountdown(prev => prev === null ? 10 : prev)
          } else {
            setFocusStatus('focused')
            setDistractReason(null)
            setCountdown(null)
          }
        })
        .catch(err => console.error('Focus API error:', err))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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
      {/* Hidden canvases for frame capture */}
      <canvas ref={camCanvasRef}    width={640} height={480} className="hidden" />
      <canvas ref={screenCanvasRef} width={640} height={480} className="hidden" />

      {/* Warning banner */}
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