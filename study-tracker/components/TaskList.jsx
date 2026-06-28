'use client'

import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

const SUBJECT_COLORS = {
  MATHEMATICS:         'bg-purple-100 text-purple-700',
  BIOLOGY:             'bg-green-100 text-green-700',
  HISTORY:             'bg-amber-100 text-amber-700',
  'RELIGIOUS STUDIES': 'bg-teal-100 text-teal-700',
  ARTS:                'bg-pink-100 text-pink-700',
  SCIENCE:             'bg-blue-100 text-blue-700',
  DEFAULT:             'bg-gray-100 text-gray-600',
}

export default function TaskCard({ task }) {
  const subjectColor =
    SUBJECT_COLORS[task.subject?.toUpperCase()] ?? SUBJECT_COLORS.DEFAULT

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">

        {/* Left */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {task.subject && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${subjectColor}`}>
                {task.subject}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-gray-900 leading-snug">{task.taskName}</h3>

          {task.note && (
            <p className="text-xs text-gray-400 italic">"{task.note}"</p>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {task.completeTask ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <CheckCircle className="w-3.5 h-3.5" /> COMPLETE
            </span>
          ) : task.TaskOvertime ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-500">
              <Clock className="w-3.5 h-3.5" /> OVERTIME
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#8B1A4A]">
              <AlertCircle className="w-3.5 h-3.5" /> INCOMPLETE
            </span>
          )}
        </div>

      </div>
    </div>
  )
}