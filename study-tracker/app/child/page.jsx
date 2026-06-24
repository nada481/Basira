'use client'

import { useState, useEffect, useRef } from 'react'
import FocusCamera from '@/components/FocusCamera'

const SESSION_GOALS = [
  { id: 1, label: 'Complete Chapter 4 reading' },
  { id: 2, label: 'Draft essay outline' },
  { id: 3, label: 'Review vocabulary list' },
]

export default function ChildStudyPage() {
  const [goals, setGoals] = useState(SESSION_GOALS.map(g => ({ ...g, done: false })))
  const [sessionActive, setSessionActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)
  const videoRef = useRef(null)

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

  const startSession  = () => { setTimeLeft(25 * 60); setSessionActive(true); setIsPaused(false) }
  const completeSession = () => { clearInterval(timerRef.current); setSessionActive(false); setTimeLeft(25 * 60) }
  const toggleGoal    = (id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g))
  const formatTime    = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  const remaining     = goals.filter(g => !g.done).length

  return (
    <main className="min-h-screen bg-white">

      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
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

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* ── Camera / Placeholder ─────────────────────────────────────────── */}
        <div className="w-full rounded-2xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
          {sessionActive ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
              <span className="text-4xl"></span>
              <span className="text-sm">Camera will start when session begins</span>
            </div>
          )}
        </div>

        {/* ── Session Goals ────────────────────────────────────────────────── */}
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

        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between gap-3">

          {/* Time + label */}
          <div className="flex flex-col leading-tight">
            <span className="timer-mono text-3xl font-bold text-[#8B1A4A]">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Stay Focused
            </span>
          </div>

          {/* Icon buttons */}
          <div className="flex items-center gap-2 text-gray-400">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Camera">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Screen">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPaused(p => !p)}
            disabled={!sessionActive}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isPaused ? (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>

          {/* Complete */}
          <button
            onClick={completeSession}
            disabled={!sessionActive}
            className="flex items-center gap-2 bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold tracking-wide px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            COMPLETE SESSION
          </button>
        </div>

      </div>

      {sessionActive && <FocusCamera videoRef={videoRef} />}

    </main>
  )
}