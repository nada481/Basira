'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, ArrowRight } from 'lucide-react'

export default function ParentDashboardPage({ params }) {
  const { parentId } = params
  const router = useRouter()
  // edit params
  const [parentName, setParentName] = useState('Parent')
  const [children, setChildren]     = useState([])
  const [parentTip, setParentTip]   = useState('')
  const [loading, setLoading]       = useState(true)

  const [linkEmail, setLinkEmail]     = useState('')
  const [linking, setLinking]         = useState(false)
  const [linkError, setLinkError]     = useState(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/parent', {
        headers: { 'x-user-id': parentId },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load dashboard')

      setParentName(data.parentName)
      setChildren(data.children ?? [])
      setParentTip(data.parentTip ?? '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [parentId])

  async function handleLinkChild() {
    if (!linkEmail.trim()) return
    setLinking(true)
    setLinkError(null)
    setLinkSuccess(false)

    try {
      const res = await fetch('/api/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': parentId },
        body: JSON.stringify({ email: linkEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to link student')

      setLinkEmail('')
      setLinkSuccess(true)
      setTimeout(() => setLinkSuccess(false), 3000)
      await load()
    } catch (err) {
      setLinkError(err.message)
    } finally {
      setLinking(false)
    }
  }

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  function timeAgo(dateStr) {
    if (!dateStr) return ''
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diffMs / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return days === 1 ? 'Yesterday' : `${days} days ago`
  }

  const recentMilestones = children
    .flatMap(child =>
      (child.recentTasks ?? []).map(task => ({
        ...task,
        childName: child.display_name ?? child.full_name ?? 'Student',
      }))
    )
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5)

  return (
    <main className="w-full px-8 py-6 max-w-6xl mx-auto">

      <h1 className="text-3xl font-bold text-[#8B1A4A] mb-1">
        Welcome back, {parentName}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Here is a snapshot of your children's learning journey today.
      </p>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-800">Family Overview</h2>
        <button className="text-xs font-semibold text-[#8B1A4A] flex items-center gap-1 hover:underline">
          Manage All Students <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 mb-8">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

          {children.map(child => {
            const name = child.display_name ?? child.full_name ?? 'Student'
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const pct = Math.min(Math.round((child.todaySeconds / (3 * 3600)) * 100), 100)

            return (
              <div key={child.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-50 text-[#8B1A4A] font-bold flex items-center justify-center text-sm">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{name}</p>
                      <p className="text-xs text-gray-400">{child.grade ?? 'Grade —'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Today's Time</span>
                    <span className="font-bold text-[#8B1A4A]">{formatTime(child.todaySeconds)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#8B1A4A] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/parent/progress/${child.id}`)}
                  className="w-full bg-[#8B1A4A] hover:bg-[#a32258] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                >
                  View Progress
                </button>
              </div>
            )
          })}

          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">Add to the Family</p>
              <p className="text-xs text-gray-400 mt-1">
                Link a new student account to your dashboard via their school email.
              </p>
            </div>
            <input
              type="email"
              value={linkEmail}
              onChange={e => { setLinkEmail(e.target.value); setLinkError(null) }}
              placeholder="student@school.edu"
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
            />
            {linkError && <p className="text-[11px] text-red-500">{linkError}</p>}
            {linkSuccess && <p className="text-[11px] text-green-500">Student linked!</p>}
            <button
              onClick={handleLinkChild}
              disabled={linking || !linkEmail.trim()}
              className="w-full border border-[#8B1A4A] text-[#8B1A4A] text-xs font-bold py-2 rounded-xl hover:bg-pink-50 transition-colors disabled:opacity-50"
            >
              {linking ? 'Linking...' : 'Link Account'}
            </button>
          </div>

        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <h2 className="text-base font-bold text-gray-800 mb-3">Recent Learning Milestones</h2>
          <div className="flex flex-col gap-2">
            {recentMilestones.length === 0 ? (
              <p className="text-sm text-gray-400">No completed tasks yet.</p>
            ) : (
              recentMilestones.map(task => (
                <div key={task.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#8B1A4A] uppercase tracking-wide">
                      {task.subject ?? 'Task'}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {task.childName}: {task.title}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(task.updated_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-[#8B1A4A] text-white rounded-2xl p-5">
            <p className="text-xs opacity-80 mb-1">Average Weekly Study</p>
            <p className="text-2xl font-bold mb-3">—</p>
            <p className="text-[11px] opacity-70">Stats coming soon</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-700 mb-1.5">💡 Parent Tip</p>
            <p className="text-xs text-gray-500 leading-relaxed">{parentTip}</p>
          </div>
        </div>

      </div>
    </main>
  )
}