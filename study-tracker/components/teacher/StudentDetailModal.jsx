'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

function TaskStatusBadge({ task }) {
  if (task.completeTask) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Complete
    </span>
  )
  if (task.TaskOvertime) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> Overtime
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
      <Circle className="w-3 h-3" /> Pending
    </span>
  )
}

export default function StudentDetailModal({ open, onClose, student, teacherId }) {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !student) return
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/teacher?type=student-tasks&studentId=${student.id}`, {
          headers: { 'x-user-id': teacherId },
        })
        const data = await res.json()
        setTasks(data.tasks ?? [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, student, teacherId])

  if (!open || !student) return null

  const name      = student.full_name ?? student.display_name ?? 'Student'
  const initials  = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const completed = tasks.filter(t => t.completeTask).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8B1A4A] text-white font-bold flex items-center justify-center text-sm">
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{name}</p>
              <p className="text-xs text-gray-400">{student.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-[#8B1A4A]">{tasks.length}</p>
            <p className="text-[11px] text-gray-400">Total Tasks</p>
          </div>
          <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-600">{completed}</p>
            <p className="text-[11px] text-gray-400">Completed</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{tasks.length - completed}</p>
            <p className="text-[11px] text-gray-400">Pending</p>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))
          ) : tasks.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No tasks assigned yet.</p>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.taskName}</p>
                  <p className="text-xs text-gray-400">{task.subject}</p>
                </div>
                <TaskStatusBadge task={task} />
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}