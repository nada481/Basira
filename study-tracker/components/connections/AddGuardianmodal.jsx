'use client'

import { useState } from 'react'
import { X, UserPlus, Loader2 } from 'lucide-react'

export default function AddGuardianModal({ open, onClose, onSuccess }) {
  const [parentId, setParentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!parentId.trim()) {
      setError('Please enter a parent ID.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'cccccccc-0000-0000-0000-000000000001', // replace with session user id
        },
        body: JSON.stringify({ parentId: parentId.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add parent')

      onSuccess?.()
      setParentId('')
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#8B1A4A]" />
            </div>
            <h2 className="text-base font-bold text-[#8B1A4A]">Add Guardian</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-5">
          Enter the parent&apos;s account ID to link them to your profile.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Parent ID
          </label>
          <input
            type="text"
            value={parentId}
            onChange={e => setParentId(e.target.value)}
            placeholder="e.g. 8f14e45f-ceea-4d4b-..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20 focus:border-[#8B1A4A]
                       placeholder:text-gray-300"
            autoFocus
          />

          {error && (
            <p className="mt-2 text-xs text-red-500">{error}</p>
          )}

          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#8B1A4A]
                         hover:bg-[#a32258] transition-colors disabled:opacity-60
                         flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Linking...' : 'Add Guardian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}