'use client'

import { useEffect, useRef, useState } from 'react'

export default function FocusCamera({ videoRef }) {
  const canvasRef = useRef(null)
  const [focusStatus, setFocusStatus] = useState('focused')
  const [countdown, setCountdown] = useState(null)
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
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return

      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      const base64Frame = canvas.toDataURL('image/jpeg').split(',')[1]

      fetch('/api/focus/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: base64Frame }),
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
    phone_detected: 'Phone detected',
    not_writing:    'Not reading or writing',
    talking:        'Talking detected',
  }

  return (
    <>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />

      {/* Warning banner — fixed at top of screen when distracted */}
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

// const screenVideoRef = useRef(null);

// async function startScreenShare() {
//   try {
//     const screenStream = await navigator.mediaDevices.getDisplayMedia({
//       video: true,
//       audio: false,
//     });

//     if (screenVideoRef.current) {
//       screenVideoRef.current.srcObject = screenStream;
//     }
//   } catch (error) {
//     console.error("Error sharing screen:", error);
//   }
// }