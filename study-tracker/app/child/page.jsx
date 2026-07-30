'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import {
  Video, Monitor, Play, Pause, Settings, Plus, Eye, EyeOff, X,
  Camera, SwitchCamera,
} from 'lucide-react'
import FocusCamera from '@/components/session/FocusCamera'
import CompleteSessionModal from '@/components/session/CompleteSessionModal'
import PortalSidebar, { MenuButton } from '@/components/shared/PortalSidebar'
import { STUDENT_NAV } from '@/lib/portalNav'
import { DEMO_STUDENT_ID as STUDENT_ID } from '@/lib/demoUsers'

function StudyPageContent() {
  const searchParams = useSearchParams()
  const taskId       = searchParams.get('taskId')

  const [task, setTask]         = useState(null)
  const [goals, setGoals]       = useState([])
  const [newGoal, setNewGoal]   = useState('')

  const [sessionActive, setSessionActive]   = useState(false)
  const [elapsed, setElapsed]               = useState(0)
  const [isPaused, setIsPaused]             = useState(false)
  const [timerVisible, setTimerVisible]     = useState(false)
  const [menuOpen, setMenuOpen]             = useState(false)
  const [profileName, setProfileName]       = useState('Student')
  const [isSharing, setIsSharing]           = useState(false)
  const [shareError, setShareError]         = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [currentSessionId, setCurrentSessionId]   = useState(null)
  const [cameraFacing, setCameraFacing]     = useState('user')
  const [inactivityNotice, setInactivityNotice] = useState(false)

  const timerRef        = useRef(null)
  const videoRef        = useRef(null)
  const screenVideoRef  = useRef(null)
  const screenStreamRef = useRef(null)

  const handleInactivity = useCallback(() => {
    setIsPaused(true)
    setInactivityNotice(true)
    setTimeout(() => setInactivityNotice(false), 5000)
  }, [])

  useEffect(() => {
    fetch('/api/profile', { headers: { 'x-user-id': STUDENT_ID } })
      .then(r => r.json())
      .then(data => {
        const p = data.profile
        if (p) setProfileName(p.display_name ?? p.full_name ?? 'Student')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!taskId) return
    async function loadTask() {
      try {
        const res = await fetch(`/api/tasks?taskId=${taskId}`, {
          headers: { 'x-user-id': STUDENT_ID },
        })
        const data = await res.json()
        if (data.task) {
          setTask(data.task)
          if (data.task.note) {
            setGoals([{ id: Date.now(), label: data.task.note, done: false }])
          }
        }
      } catch (err) {
        console.error('Failed to load task:', err)
      }
    }
    loadTask()
  }, [taskId])

  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsed(t => t + 1)
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [sessionActive, isPaused])

  const startSession = async () => {
    setElapsed(0)
    setIsPaused(false)
    setInactivityNotice(false)

    let sessionId = null
    try {
      const res = await fetch('/api/timer?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': STUDENT_ID },
        body: JSON.stringify({ taskId: taskId || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.timer?.id) {
        sessionId = data.timer.id
      } else {
        console.error('Timer start failed:', data.error)
      }
    } catch (err) {
      console.error('Timer start failed:', err)
    }

    setCurrentSessionId(sessionId)
    setSessionActive(true)
  }

  const stopSessionTimer = async () => {
    if (!currentSessionId) return
    try {
      await fetch('/api/timer?action=stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': STUDENT_ID },
        body: JSON.stringify({ timerId: currentSessionId, totalSeconds: elapsed }),
      })
    } catch (err) {
      console.error('Timer stop failed:', err)
    }
  }

  const completeSession = () => {
    clearInterval(timerRef.current)
    setIsPaused(true)
    setShowCompleteModal(true)
  }

  const onSessionConfirmed = () => {
    setShowCompleteModal(false)
    setSessionActive(false)
    setElapsed(0)
    stopScreenShare()
  }

  const onSessionSkipped = () => {
    setShowCompleteModal(false)
    setSessionActive(false)
    setElapsed(0)
    stopScreenShare()
  }

  const toggleGoal = (id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g))
  const removeGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id))
  const addGoal = () => {
    const trimmed = newGoal.trim()
    if (!trimmed) return
    setGoals(prev => [...prev, { id: Date.now(), label: trimmed, done: false }])
    setNewGoal('')
  }

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  const remaining = goals.filter(g => !g.done).length

  async function attachScreenStream(stream) {
    const video = screenVideoRef.current
    if (!video) return
    video.srcObject = stream
    try {
      await video.play()
    } catch (err) {
      if (err?.name !== 'AbortError') throw err
    }
  }

  async function startScreenShare() {
    setShareError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      screenStreamRef.current = stream
      setIsSharing(true)
      await attachScreenStream(stream)
      stream.getVideoTracks()[0].addEventListener('ended', stopScreenShare)
    } catch (err) {
      if (err.name !== 'NotAllowedError') setShareError('Screen sharing failed. Please try again.')
    }
  }

  useEffect(() => {
    if (!isSharing || !screenStreamRef.current) return
    attachScreenStream(screenStreamRef.current).catch(() => {})
  }, [isSharing])

  function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null
    setIsSharing(false)
  }

  const toggleCameraFacing = () => {
    setCameraFacing(f => (f === 'user' ? 'environment' : 'user'))
  }

  return (
    <main className="min-h-screen bg-white">

      <PortalSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={STUDENT_NAV}
        profileName={profileName}
        profileRole="Student"
      />

      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <MenuButton onClick={() => setMenuOpen(true)} />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-[#8B1A4A] truncate">
              {task ? task.taskName : 'Study Session'}
            </h1>
            {task?.subject && (
              <p className="text-xs text-gray-400 truncate">{task.subject}</p>
            )}
          </div>
          {sessionActive && (
            <span className="hidden sm:flex shrink-0 items-center gap-1 text-xs font-medium text-[#8B1A4A] bg-pink-100 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B1A4A] animate-pulse" />
              ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={startSession}
          disabled={sessionActive}
          className="w-full sm:w-auto bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Start New
        </button>
      </header>

      {inactivityNotice && (
        <div className="mx-4 sm:mx-6 mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
          No movement detected for 10 seconds — timer paused. Press play to resume.
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">

        {/* Camera area */}
        <div className="w-full aspect-video sm:aspect-[4/3] lg:aspect-square max-h-[70vh] lg:max-h-none rounded-2xl overflow-hidden bg-gray-100 relative">
          {sessionActive && isSharing && (
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain bg-gray-900"
            />
          )}
          {sessionActive && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={
                isSharing
                  ? 'absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 w-[28%] min-w-[72px] max-w-[120px] rounded-lg sm:rounded-xl border-2 border-white shadow-lg object-cover aspect-[4/3]'
                  : 'w-full h-full object-cover'
              }
            />
          )}
          {!sessionActive && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 px-4 text-center">
              <Camera className="w-10 h-10 sm:w-12 sm:h-12 opacity-40" />
              <span className="text-sm">Camera will start when session begins</span>
            </div>
          )}

          {sessionActive && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 flex flex-col gap-1.5">
              <div className="flex rounded-lg bg-white/95 shadow-sm border border-gray-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setCameraFacing('user')}
                  className={`px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors ${
                    cameraFacing === 'user'
                      ? 'bg-[#8B1A4A] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setCameraFacing('environment')}
                  className={`px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors ${
                    cameraFacing === 'environment'
                      ? 'bg-[#8B1A4A] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Back
                </button>
              </div>
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="self-end p-2 rounded-lg bg-white/95 shadow-sm border border-gray-100 text-gray-600 hover:text-[#8B1A4A] transition-colors"
                title="Switch camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
          )}

          {isSharing && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 bg-white/90 text-gray-800 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Sharing
            </div>
          )}
        </div>

        {shareError && (
          <p className="text-xs text-red-500 text-center lg:col-span-2 -mt-2">{shareError}</p>
        )}

        <div className="flex flex-col gap-4 sm:gap-5 lg:col-start-2 lg:row-start-1 lg:row-span-2">

        {/* Session Goals */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Session Goals</h2>
            <span className="text-sm text-gray-400">{remaining} Remaining</span>
          </div>

          <div className="flex flex-col gap-2 mb-3 max-h-[40vh] lg:max-h-none overflow-y-auto">
            {goals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 group">
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={() => toggleGoal(goal.id)}
                  className="w-4 h-4 accent-[#8B1A4A] cursor-pointer flex-shrink-0"
                />
                <span className={`text-sm flex-1 break-words ${goal.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {goal.label}
                </span>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {goals.length === 0 && (
              <p className="text-xs text-gray-400 italic px-1">No goals yet — add one below.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              placeholder="Add a goal for this session..."
              className="flex-1 min-w-0 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
            />
            <button
              onClick={addGoal}
              disabled={!newGoal.trim()}
              className="p-2 bg-[#8B1A4A] hover:bg-[#a32258] disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer controls */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 sm:px-5 py-4 shadow-sm flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">
            {timerVisible ? (
              <div className="flex flex-col leading-tight">
                <span className="text-2xl sm:text-3xl font-bold text-[#8B1A4A] font-mono tabular-nums">{formatTime(elapsed)}</span>
                <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Elapsed Time</span>
              </div>
            ) : (
              <div className="flex flex-col leading-tight">
                <span className="text-xs sm:text-sm font-medium text-gray-400">Timer hidden</span>
                <span className="text-[10px] text-gray-300">Tap the eye to show</span>
              </div>
            )}
            <button
              onClick={() => setTimerVisible(v => !v)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              title={timerVisible ? 'Hide timer' : 'Show timer'}
            >
              {timerVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400">
              <button
                disabled={!sessionActive}
                className={`p-2 rounded-lg transition-colors ${sessionActive ? 'hover:bg-gray-100 text-gray-500' : 'opacity-30 cursor-not-allowed'}`}
                title={`Camera: ${cameraFacing === 'user' ? 'Front' : 'Back'}`}
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={() => isSharing ? stopScreenShare() : startScreenShare()}
                disabled={!sessionActive}
                className={`p-2 rounded-lg transition-colors ${isSharing ? 'bg-red-50 text-red-500 hover:bg-red-100' : sessionActive ? 'hover:bg-gray-100 text-gray-500' : 'opacity-30 cursor-not-allowed'}`}
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setIsPaused(p => !p)}
              disabled={!sessionActive}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
            >
              {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={completeSession}
              disabled={!sessionActive}
              className="flex items-center gap-2 bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wide px-3 sm:px-4 py-2.5 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">COMPLETE</span>
              <span className="sm:hidden">DONE</span>
            </button>
          </div>
        </div>

        </div>
      </div>

      {sessionActive && (
        <FocusCamera
          videoRef={videoRef}
          screenVideoRef={screenVideoRef}
          sessionId={currentSessionId}
          userId={STUDENT_ID}
          enabled={!isPaused}
          facingMode={cameraFacing}
          onInactivity={handleInactivity}
          estimatedSecondsPerQuestion={3 * 60}
        />
      )}

      <CompleteSessionModal
        open={showCompleteModal}
        sessionId={currentSessionId}
        taskId={taskId}
        elapsed={elapsed}
        onStopTimer={stopSessionTimer}
        onClose={onSessionSkipped}
        onConfirm={onSessionConfirmed}
      />
    </main>
  )
}

export default function ChildStudyPage() {
  return (
    <Suspense>
      <StudyPageContent />
    </Suspense>
  )
}
