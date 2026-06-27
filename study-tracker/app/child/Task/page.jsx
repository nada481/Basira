'use client'

import { useState, useEffect } from 'react'
import { getTasksByStudent } from '@/services/taskService'
import TaskCard from '@/components/TaskList'

export default function TaskPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    async function load() {
      try {
        const data = await getTasksByStudent(1) // replace with real userID later
        setTasks(data)
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
    if (filter === 'PENDING')   return t.completeTask !== true
    return true
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-[#8B1A4A] mb-1">Tasks</h1>
      <p className="text-sm text-gray-500 mb-5">
        Review your assigned academic requirements and track your progress through the curriculum.
      </p>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6">
        {['ALL', 'PENDING', 'COMPLETED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-colors ${
              filter === f
                ? 'bg-[#8B1A4A] text-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading
        ? <p className="text-gray-400 text-sm">Loading tasks...</p>
        : filtered.length === 0
          ? <p className="text-gray-400 text-sm">No tasks found.</p>
          : <div className="flex flex-col gap-3">
              {filtered.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
      }
    </main>
  )
}