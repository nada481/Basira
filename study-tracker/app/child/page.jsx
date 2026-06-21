'use client'


import { useState, useRef } from 'react'


export default function Child() {
    const screenVideoRef = useRef(null)
    const streemRef = useRef(null)
    const [sharing, setSharing] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const pageStartTime = useRef(Date.now())
    const [currentSlide, setCurrentSlide] = useState(1)
    const slideStartTime = useRef(Date.now())


    async function startScreenShare() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
            screenVideoRef.current.srcObject = stream
            streemRef.current = stream
            setSharing(true)
        } catch (err) {
            console.error('Error starting screen share:', err)
        }

        // stop sharing if the user is distracted for > 10 seconds
        stream.getVideoTracks()[0].onended = () => stopScreenShare()

} 
    function stopScreenShare() {
        streemRef.current?.getTracks().forEach(track => track.stop())
        setSharing(false)
    }
    // call this every time the student flips a page in the PDF viewer

    async function handlePageFlip(newPage) {
        const timespend = Math.floor((Date.now() - pageStartTime.current) / 1000)
        await fetch('/api/page-tracking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                previousPage: currentPage,
                timeSpent,
                sessionId: 'your-session-id'
            })
        })
        setCurrentPage(newPage)
        pageStartTime.current = Date.now()
    }

    // powerpoint presentation tracking
    // call this every time the student flips a slide in the PowerPoint viewer
    async function handleSlideFlip(newSlide) {
        const timespend = Math.floor((Date.now() - slideStartTime.current) / 1000)
        await fetch('/api/slide-tracking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                previousSlide: currentSlide,
                timeSpent,
                sessionId: 'your-session-id'
            })
        })
        setCurrentSlide(newSlide)
        slideStartTime.current = Date.now()
    }

    // here add a button from lucid 
      return (
    <div>
      <button onClick={sharing ? stopScreenShare : startScreenShare}>
        {sharing ? 'Stop Sharing' : 'Share Screen'}
      </button>
      <video ref={screenVideoRef} autoPlay muted style={{ width: 400 }} />
    </div>
  )

    
}


