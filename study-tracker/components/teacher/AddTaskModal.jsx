'use client'

import { useState } from 'react'
import { X, ClipboardPlus, Loader2, Upload } from 'lucide-react'

export default function AddTaskModal({ open, onClose, classes, teacherId, onSuccess }) {
  const [classId, setClassId]             = useState('')
  const [taskName, setTaskName]           = useState('')
  const [subject, setSubject]             = useState('')
  const [description, setDescription]     = useState('')
  const [estimatedMins, setEstimatedMins] = useState('')
  const [dueDate, setDueDate]             = useState('')
  const [file, setFile]                   = useState(null)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!classId || !taskName) { setError('Class and task name are required.'); return }

    setLoading(true)
    try {
      let fileUrl = null

      // 1. Upload file to Supabase Storage if provided
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('classId', classId)
        const uploadRes = await fetch('/api/teacher/upload', {
          method: 'POST',
          headers: { 'x-user-id': teacherId },
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Upload failed')
        fileUrl = uploadData.fileUrl
      }

      // 2. Create task for whole class
      const res = await fetch('/api/teacher?action=create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': teacherId },
        body: JSON.stringify({
          classId,
          taskName,
          subject,
          description,
          estimatedMinutes: estimatedMins ? parseInt(estimatedMins) : null,
          dueDate:          dueDate || null,
          fileUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create task')

      onSuccess?.()
      onClose()
      // reset
      setClassId(''); setTaskName(''); setSubject(''); setDescription('')
      setEstimatedMins(''); setDueDate(''); setFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <ClipboardPlus className="w-4 h-4 text-[#8B1A4A]" />
            </div>
            <h2 className="text-base font-bold text-[#8B1A4A]">New Assignment</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Class */}
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

          {/* Task name */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={e => setTaskName(e.target.value)}
              placeholder="e.g. Chapter 5 Review"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Instructions for students..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20 resize-none"
            />
          </div>

          {/* Estimated time + due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Est. Minutes</label>
              <input
                type="number"
                value={estimatedMins}
                onChange={e => setEstimatedMins(e.target.value)}
                placeholder="30"
                min="1"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
              />
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Attachment (optional)</label>
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 cursor-pointer hover:border-[#8B1A4A] transition-colors">
              <Upload className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">{file ? file.name : 'Upload document or image'}</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

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
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}