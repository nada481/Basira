'use client'

import { useState } from 'react'
import { X, UserPlus, Loader2 } from 'lucide-react'

export default function AddStudentModal({ open, onClose, classes, teacherId, onSuccess }) {
  const [classId, setClassId] = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!classId || !email.trim()) { setError('Class and email are required.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/teacher?action=add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': teacherId },
        body: JSON.stringify({ classId, email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add student')

      setSuccess(true)
      setEmail('')
      setTimeout(() => { setSuccess(false); onSuccess?.(); onClose() }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#8B1A4A]" />
            </div>
            <h2 className="text-base font-bold text-[#8B1A4A]">Add Student</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Class</label>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
            >
              <option value="">Select a class...</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Student Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="student@school.edu"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
              autoFocus
            />
          </div>

          {error   && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-green-500">Student added successfully!</p>}

          <div className="flex gap-2 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#8B1A4A] hover:bg-[#a32258] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}