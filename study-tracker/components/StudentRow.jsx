'use client'

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatLastActive(lastActive, isOnline) {
  if (isOnline) return { label: 'Online', color: 'text-green-500' }
  if (!lastActive) return { label: 'Never', color: 'text-gray-400' }

  const diff = Date.now() - new Date(lastActive).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (mins < 60)   return { label: `${mins} mins ago`,  color: 'text-[#8B1A4A]' }
  if (hours < 24)  return { label: `${hours} hours ago`, color: 'text-gray-500' }
  return { label: 'Yesterday', color: 'text-gray-400' }
}

export default function StudentRow({ student, grade, onViewReport }) {
  const initials   = getInitials(student.full_name ?? student.display_name)
  const focusScore = student.focusScore ?? 0
  const { label, color } = formatLastActive(student.lastActive, student.isOnline)

  const barColor = focusScore >= 80 ? 'bg-[#8B1A4A]' : focusScore >= 50 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="grid grid-cols-[2fr_1fr_1fr_2fr_auto] items-center px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">

      {/* Name + email */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#8B1A4A] text-white text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{student.full_name ?? student.display_name}</p>
          <p className="text-xs text-gray-400">{student.email}</p>
        </div>
      </div>

      {/* Grade */}
      <span className="text-sm text-gray-600">{grade}</span>

      {/* Last active */}
      <span className={`text-sm font-medium ${color}`}>{label}</span>

      {/* Focus score bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${focusScore}%` }} />
        </div>
        <span className="text-sm font-bold text-gray-700 w-6 text-right">{focusScore}</span>
      </div>

      {/* Action */}
      <button
        onClick={() => onViewReport(student.id)}
        className="text-xs font-semibold text-[#8B1A4A] hover:text-[#C4526A] transition-colors whitespace-nowrap ml-4"
      >
        View Full Report
      </button>
    </div>
  )
}