'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, Suspense } from 'react'
import {
  BookOpen, CheckSquare, TrendingUp, Users, X, Menu,
  Video, Monitor, Play, Pause, Settings, Plus, Eye, EyeOff,
} from 'lucide-react'
import FocusCamera from '@/components/session/FocusCamera'
import CompleteSessionModal from '@/components/session/CompleteSessionModal'

const STUDENT_ID = 'cccccccc-0000-0000-0000-000000000001'

const NAV_ITEMS = [
  { label: 'Study Area', icon: BookOpen,    href: '/child' },
  { label: 'Tasks',      icon: CheckSquare, href: '/child/Task' },
  { label: 'Growth',     icon: TrendingUp,  href: '/child/Growth' },
  { label: 'Connection', icon: Users,       href: '/child/Connections' },
]

function StudyPageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const taskId       = searchParams.get('taskId')

  // Task info
  const [task, setTask]         = useState(null)

  // Goals — user-editable list
  const [goals, setGoals]       = useState([])
  const [newGoal, setNewGoal]   = useState('')

  // Session state
  const [sessionActive, setSessionActive]   = useState(false)
  const [elapsed, setElapsed]               = useState(0)
  const [isPaused, setIsPaused]             = useState(false)
  const [timerVisible, setTimerVisible]     = useState(true)
  const [menuOpen, setMenuOpen]             = useState(false)
  const [activeNav, setActiveNav]           = useState('Study Area')
  const [isSharing, setIsSharing]           = useState(false)
  const [shareError, setShareError]         = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [currentSessionId, setCurrentSessionId]   = useState(null)

  const timerRef        = useRef(null)
  const videoRef        = useRef(null)
  const screenVideoRef  = useRef(null)
  const screenStreamRef = useRef(null)

  // Load task if taskId is in URL
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
          // Pre-populate goals from task note if available
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

  // Timer counts UP (elapsed time)
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

  const startSession = () => {
    setElapsed(0)
    setSessionActive(true)
    setIsPaused(false)
    setCurrentSessionId('eeeeeeee-0000-0000-0000-000000000001')
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

  // Goals
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

  async function startScreenShare() {
    setShareError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      screenStreamRef.current = stream
      if (screenVideoRef.current) screenVideoRef.current.srcObject = stream
      setIsSharing(true)
      stream.getVideoTracks()[0].addEventListener('ended', stopScreenShare)
    } catch (err) {
      if (err.name !== 'NotAllowedError') setShareError('Screen sharing failed. Please try again.')
    }
  }

  function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null
    setIsSharing(false)
  }

  return (
    <main className="min-h-screen bg-white">

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-[#8B1A4A]">Basira</span>
          <button onClick={() => setMenuOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(item => (
            <button key={item.label}
              onClick={() => { router.push(item.href); setActiveNav(item.label); setMenuOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === item.label ? 'bg-pink-50 text-[#8B1A4A]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mx-3 mb-5 rounded-2xl bg-pink-50 border border-pink-100 p-4">
          <p className="text-xs font-semibold text-[#8B1A4A] uppercase tracking-wider mb-1">Family Connect</p>
          <p className="text-xs text-gray-500 mb-3">Your parent can watch your session live.</p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#8B1A4A] text-white flex items-center justify-center text-xs font-bold">M</div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Mom</p>
              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
              </span>
            </div>
          </div>
          <button
            onClick={() => { setMenuOpen(false); if (!isSharing) startScreenShare() }}
            className="w-full flex items-center justify-center gap-2 bg-[#8B1A4A] hover:bg-[#C4526A] text-white text-xs font-bold py-2 rounded-xl transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" /> Share Screen with Mom
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#8B1A4A]">
              {task ? task.taskName : 'Study Session'}
            </h1>
            {task?.subject && (
              <p className="text-xs text-gray-400">{task.subject}</p>
            )}
          </div>
          {sessionActive && (
            <span className="flex items-center gap-1 text-xs font-medium text-[#8B1A4A] bg-pink-100 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B1A4A] animate-pulse" />
              FOCUS SESSION ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={startSession}
          disabled={sessionActive}
          className="bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Start New
        </button>
      </header>

      <div className="px-8 py-6 flex flex-col gap-5">

        {/* Camera / Screen preview */}
        <div className="w-full rounded-2xl overflow-hidden bg-gray-100 relative" style={{ aspectRatio: '16/9' }}>
          {isSharing && <video ref={screenVideoRef} autoPlay muted className="w-full h-full object-contain bg-black" />}
          {sessionActive && !isSharing && <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />}
          {!sessionActive && !isSharing && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
              <span className="text-4xl">📷</span>
              <span className="text-sm">Camera will start when session begins</span>
            </div>
          )}
          {isSharing && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Sharing Screen
            </div>
          )}
          {isSharing && sessionActive && (
            <video ref={videoRef} autoPlay muted className="absolute bottom-3 right-3 w-28 rounded-xl border-2 border-white shadow-lg object-cover" style={{ aspectRatio: '4/3' }} />
          )}
        </div>

        {shareError && <p className="text-xs text-red-500 text-center -mt-3">{shareError}</p>}

        {/* Session Goals */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Session Goals</h2>
            <span className="text-sm text-gray-400">{remaining} Remaining</span>
          </div>

          <div className="flex flex-col gap-2 mb-3">
            {goals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 group">
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={() => toggleGoal(goal.id)}
                  className="w-4 h-4 accent-[#8B1A4A] cursor-pointer flex-shrink-0"
                />
                <span className={`text-sm flex-1 ${goal.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {goal.label}
                </span>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {goals.length === 0 && (
              <p className="text-xs text-gray-400 italic px-1">No goals yet — add one below.</p>
            )}
          </div>

          {/* Add goal input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={e => setNewGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGoal()}
              placeholder="Add a goal for this session..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
            />
            <button
              onClick={addGoal}
              disabled={!newGoal.trim()}
              className="p-2 bg-[#8B1A4A] hover:bg-[#a32258] disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer controls */}
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between gap-3">

          {/* Timer display with hide toggle */}
          <div className="flex items-center gap-3">
            {timerVisible ? (
              <div className="flex flex-col leading-tight">
                <span className="text-3xl font-bold text-[#8B1A4A] font-mono">{formatTime(elapsed)}</span>
                <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Elapsed Time</span>
              </div>
            ) : (
              <div className="flex flex-col leading-tight">
                <span className="text-3xl font-bold text-gray-200 font-mono">••:••</span>
                <span className="text-[10px] font-semibold tracking-widest text-gray-300 uppercase">Hidden</span>
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

          <div className="flex items-center gap-2 text-gray-400">
            <button disabled={!sessionActive} className={`p-2 rounded-lg transition-colors ${sessionActive ? 'hover:bg-gray-100 text-gray-500' : 'opacity-30 cursor-not-allowed'}`}>
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
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={completeSession}
            disabled={!sessionActive}
            className="flex items-center gap-2 bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wide px-4 py-2.5 rounded-xl transition-colors"
          >
            <Settings className="w-4 h-4" />
            COMPLETE SESSION
          </button>
        </div>

      </div>

      {sessionActive && (
        <FocusCamera
          videoRef={videoRef}
          screenVideoRef={screenVideoRef}
          sessionId={currentSessionId}
          estimatedSecondsPerQuestion={3 * 60}
        />
      )}

      <CompleteSessionModal
        open={showCompleteModal}
        sessionId={currentSessionId}
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