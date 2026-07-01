'use client'

import { useRouter } from 'next/navigation'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const EFFORT_COLOR = {
  High:   'text-green-600',
  Medium: 'text-amber-500',
  Low:    'text-red-500',
}

export default function ChildCard({ child }) {
  const router   = useRouter()
  const initials = getInitials(child.full_name ?? child.display_name)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4 min-w-[220px]">

      {/* Avatar + name + grade/age */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {child.avatar_url ? (
            <img src={child.avatar_url} alt={child.full_name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#8B1A4A] text-white text-sm font-bold flex items-center justify-center">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-800">{child.full_name ?? child.display_name}</p>
            <p className="text-xs text-gray-400">
              {child.grade && `Grade ${child.grade}`}
              {child.grade && child.age && ' • '}
              {child.age && `${child.age} Years Old`}
            </p>
          </div>
        </div>
      </div>

      {/* Today's time */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Today's Time</p>
        <p className="text-xl font-bold text-gray-800 mt-0.5">{formatTime(child.todaySeconds ?? 0)}</p>
      </div>

      {/* Today's session card — shown if active session exists */}
      {child.activeSession && (
        <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Today's Time</p>
            <p className="text-sm font-bold text-gray-700">{formatTime(child.activeSession.seconds)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Effort</p>
            <p className={`text-sm font-bold ${EFFORT_COLOR[child.effortLevel] ?? 'text-gray-700'}`}>
              {child.effortLevel ?? 'Medium'}
            </p>
          </div>
        </div>
      )}

      {/* View Progress Report */}
      <button
        onClick={() => router.push(`/parent/reports/${child.id}`)}
        className="flex items-center justify-center gap-2 bg-[#8B1A4A] hover:bg-[#C4526A] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors"
      >
        View Progress Report →
      </button>
    </div>
  )
}