'use client'

import { useState, useEffect } from 'react'
import TaskCard from '@/components/Tasks/TaskList'
import PortalSidebar, { MenuButton } from '@/components/shared/PortalSidebar'
import { STUDENT_NAV } from '@/lib/portalNav'
import { DEMO_STUDENT_ID } from '@/lib/demoUsers'

export default function TaskPage() {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]   = useState('ALL')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileName, setProfileName] = useState('Student')

  useEffect(() => {
    fetch('/api/profile', { headers: { 'x-user-id': DEMO_STUDENT_ID } })
      .then(r => r.json())
      .then(data => {
        const p = data.profile
        if (p) setProfileName(p.display_name ?? p.full_name ?? 'Student')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tasks', {
          headers: { 'x-user-id': DEMO_STUDENT_ID },
        })
        if (!res.ok) throw new Error('Failed to load tasks')
        const { tasks } = await res.json()
        setTasks(tasks)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = tasks.filter(t => {
    if (filter === 'COMPLETED') return t.completeTask === true
    if (filter === 'PENDING') return t.completeTask !== true
    return true
  })

  return (
    <main className="min-h-screen w-full bg-white">
      <PortalSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={STUDENT_NAV}
        profileName={profileName}
        profileRole="Student"
      />

      <header className="flex items-center gap-3 px-8 py-4 border-b border-gray-100">
        <MenuButton onClick={() => setMenuOpen(true)} />
        <div>
          <h1 className="text-xl font-semibold text-[#8B1A4A]">Tasks</h1>
          <p className="text-xs text-gray-400">
            Review your assigned academic requirements and track your progress.
          </p>
        </div>
      </header>

      <div className="px-8 py-6">
        <div className="flex items-center gap-2 mb-6">
          {['ALL', 'PENDING', 'COMPLETED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === f
                  ? 'bg-[#8B1A4A] text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading tasks...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">No tasks found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
