'use client'
import {useRouter} from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { BookOpen, CheckSquare, TrendingUp, Users, X, Menu, Video, Monitor, Play, Pause, Settings, Wifi } from 'lucide-react'
import FocusCamera from '@/components/FocusCamera'



const SESSION_GOALS = [
  { id: 1, label: 'Complete Chapter 4 reading' },
  { id: 2, label: 'Draft essay outline' },
  { id: 3, label: 'Review vocabulary list' },
]


const NAV_ITEMS = [
  { label: 'Study Area', icon: BookOpen,    href: '/child' },
  { label: 'Tasks',      icon: CheckSquare, href: '/child/Task' },
  { label: 'Growth',     icon: TrendingUp,  href: '/child/Growth' },
  { label: 'Connection',     icon: Users,       href: '/child/Connections' },
]


export default function ChildStudyPage() {
  const [goals, setGoals]               = useState(SESSION_GOALS.map(g => ({ ...g, done: false })))
  const [sessionActive, setSessionActive] = useState(false)
  const [timeLeft, setTimeLeft]         = useState(25 * 60)
  const [isPaused, setIsPaused]         = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [activeNav, setActiveNav]       = useState('Study Area')
  const router = useRouter()

  // Screen share state
  const [isSharing, setIsSharing]       = useState(false)
  const [shareError, setShareError]     = useState(null)

  const timerRef      = useRef(null)
  const videoRef      = useRef(null)
  const screenVideoRef = useRef(null)
  const screenStreamRef = useRef(null)

  useEffect(() => {
    if (sessionActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); setSessionActive(false); return 0 }
          return t - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [sessionActive, isPaused])

  const startSession    = () => { setTimeLeft(25 * 60); setSessionActive(true); setIsPaused(false) }
  const completeSession = () => {
    clearInterval(timerRef.current)
    setSessionActive(false)
    setTimeLeft(25 * 60)
    stopScreenShare()
  }
  const toggleGoal  = (id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g))
  const formatTime  = (s)  => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  const remaining   = goals.filter(g => !g.done).length

  //  Screen share part

  async function startScreenShare() {
    setShareError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      screenStreamRef.current = stream
      if (screenVideoRef.current) screenVideoRef.current.srcObject = stream
      setIsSharing(true)

      // auto-stop when user ends share from browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare()
      })
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setShareError('Screen sharing failed. Please try again.')
      }
    }
  }

  function stopScreenShare() {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current = null
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null
    setIsSharing(false)
  }

  function toggleScreenShare() {
    isSharing ? stopScreenShare() : startScreenShare()
  }

  return (
    <main className="w-full px-8 py-6">

      {/*  Slide-in sidebar menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-[#8B1A4A]">Basira</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => { 
                router.push(item.href)
                setActiveNav(item.label)
                setMenuOpen(false)
               }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === item.label
                  ? 'bg-pink-50 text-[#8B1A4A]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Family Connect card */}
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
            onClick={() => {
              setMenuOpen(false)
              if (!isSharing) startScreenShare()
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#8B1A4A] hover:bg-[#C4526A] text-white text-xs font-bold py-2 rounded-xl transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
            Share Screen with Mom
          </button>
        </div>
      </aside>

      {/*  Header  */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-xl font-semibold text-[#8B1A4A]">Study Session</h1>
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

        {/*  Camera / Screen preview  */}
        <div className="w-full rounded-2xl overflow-hidden bg-gray-100 relative" style={{ aspectRatio: '16/9' }}>
          {/* Screen share preview — shown when sharing */}
          {isSharing && (
            <video
              ref={screenVideoRef}
              autoPlay
              muted
              className="w-full h-full object-contain bg-black"
            />
          )}

          {/* Webcam — shown when session active and not sharing */}
          {sessionActive && !isSharing && (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Placeholder — shown when nothing active */}
          {!sessionActive && !isSharing && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
              <span className="text-4xl">📷</span>
              <span className="text-sm">Camera will start when session begins</span>
            </div>
          )}

          {/* Screen share badge */}
          {isSharing && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Sharing Screen
            </div>
          )}

          {/* PiP webcam when screen sharing */}
          {isSharing && sessionActive && (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="absolute bottom-3 right-3 w-28 rounded-xl border-2 border-white shadow-lg object-cover"
              style={{ aspectRatio: '4/3' }}
            />
          )}
        </div>

        {/* Screen share error */}
        {shareError && (
          <p className="text-xs text-red-500 text-center -mt-3">{shareError}</p>
        )}

        {/* ── Session Goals ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Session Goals</h2>
            <span className="text-sm text-gray-400">{remaining} Tasks Remaining</span>
          </div>

          <div className="flex flex-col gap-3">
            {goals.map(goal => (
              <label
                key={goal.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={goal.done}
                  onChange={() => toggleGoal(goal.id)}
                  className="w-4 h-4 accent-[#8B1A4A] cursor-pointer"
                />
                <span className={`text-sm ${goal.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {goal.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/*  Timer controls */}
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between gap-3">

          <div className="flex flex-col leading-tight">
            <span className="timer-mono text-3xl font-bold text-[#8B1A4A]">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Stay Focused
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-400">
            {/* Camera toggle */}
            <button
              className={`p-2 rounded-lg transition-colors ${sessionActive ? 'hover:bg-gray-100 text-gray-500' : 'opacity-30 cursor-not-allowed'}`}
              title="Camera"
              disabled={!sessionActive}
            >
              <Video className="w-5 h-5" />
            </button>

            {/* Screen share button  */}
            <button
              onClick={toggleScreenShare}
              disabled={!sessionActive}
              className={`p-2 rounded-lg transition-colors ${
                isSharing
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : sessionActive
                    ? 'hover:bg-gray-100 text-gray-500'
                    : 'opacity-30 cursor-not-allowed'
              }`}
              title={isSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPaused(p => !p)}
            disabled={!sessionActive}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Complete */}
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

      {sessionActive && <FocusCamera videoRef={videoRef} screenVideoRef={screenVideoRef} />}

    </main>
  )
}