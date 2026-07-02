import FocusBar from './FocusBar'

function getInitials(name) {
  return (name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(dateStr, isOnline) {
  if (isOnline) return 'Online'
  if (!dateStr) return 'Never'
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins} mins ago`
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default function StudentRow({ student, onSelect }) {
  const name  = student.full_name ?? student.display_name ?? 'Student'
  const grade = student.className?.match(/Grade\s*\d+/i)?.[0] ?? 'Grade 5'

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {getInitials(name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{name}</p>
            <p className="text-xs text-[#8B1A4A]">{student.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{grade}</td>
      <td className={`px-4 py-4 text-sm font-medium ${student.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
        {timeAgo(student.lastActive, student.isOnline)}
      </td>
      <td className="px-4 py-4">
        <FocusBar score={student.focusScore ?? 0} />
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={onSelect}
          className="text-sm font-semibold text-[#8B1A4A] hover:underline"
        >
          View Full Report
        </button>
      </td>
    </tr>
  )
}