'use client'


import { useEffect, useRef } from 'react'

export default function FocusCamera() {
  const videoRef = useRef(null) // this will hold the video element reference
  const canvasRef = useRef(null) // this will hold the canvas element reference

  // webcam setup and face detection logic
    useEffect(() => {
        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
            } catch (error) {
                console.error('Error accessing webcam:', error)
            }
        }

        setupCamera()
    }, [])


    useEffect(() => {
        const interval = setInterval(() => {
                const video = videoRef.current
                const canvas = canvasRef.current
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
                const base64Frame = canvas.toDataURL('image/jpeg').split(',')[1]
            fetch('/api/focus/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ frame: base64Frame })
            })
            .then(res => res.json()).then(data => {
                if (!data.focused) {
                    setFocusStatus("distracted")
                    setCountdown(10) // start the 10s warning countdown
                } else {
                    setFocusStatus("focused")
                    setCountdown(null) // reset countdown if user is focused
                }
            })

        }, 1000) // check every second

        return () => clearInterval(interval) // cleanup on unmount
    }, [])

  return (
    <div className="focus-camera">
      <video ref={videoRef} autoPlay muted style={{ width: 200 }} />
      <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
      <p>Status: {focusStatus}</p>
      {countdown && <p>Warning: get back to work! ({countdown}s)</p>}
    </div>
  )
    
}