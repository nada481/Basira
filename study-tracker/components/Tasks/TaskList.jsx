'use client'

import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react'

const SUBJECT_COLORS = {
  history:          { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  biology:          { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
  mathematics:      { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  math:             { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  arabic:           { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  chemistry:        { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200' },
  'religious studies': { bg: 'bg-teal-50', text: 'text-teal-700',    border: 'border-teal-200' },
  arts:             { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200' },
  english:          { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200' },
}

function getSubjectStyle(subject) {
  const key = (subject ?? '').toLowerCase()
  for (const [k, v] of Object.entries(SUBJECT_COLORS)) {
    if (key.includes(k)) return v
  }
  return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
}

export default function TaskCard({ task }) {
  const router   = useRouter()
  const style    = getSubjectStyle(task.subject)
  const complete = task.completeTask === true

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all">

      {/* Subject pill */}
      <div className="flex-1 min-w-0">
        <div className="mb-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
            {task.subject ?? 'General'}
          </span>
        </div>

        <p className="text-sm font-semibold text-gray-800 truncate">{task.taskName}</p>

        {task.note && (
          <p className="text-xs text-gray-400 italic mt-0.5 truncate">"{task.note}"</p>
        )}
      </div>

      {/* Right side — status + action */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {/* Start Session button — only for incomplete tasks */}
        {!complete && (
          <button
            onClick={() => router.push(`/child?taskId=${task.id}`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8B1A4A] border border-[#8B1A4A] px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Start Session
          </button>
        )}

        {/* Status badge */}
        {complete ? (
          <span className="flex items-center gap-1 text-xs font-bold text-green-600">
            <CheckCircle2 className="w-4 h-4" /> COMPLETE
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold text-red-400">
            <AlertCircle className="w-4 h-4" /> INCOMPLETE
          </span>
        )}

      </div>
    </div>
  )
}