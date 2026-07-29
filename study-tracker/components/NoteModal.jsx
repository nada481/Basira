'use client'

import { X, Sparkles, Clock, CheckCircle, AlertCircle, FileText, Eye, Target } from 'lucide-react'
import { formatDuration } from '@/lib/sessionPerformance'

function DistractionList({ sessionPerformance }) {
  if (!sessionPerformance) return null

  const { distractions, hadDistractions, breakdownText, focusScore, studySeconds, totalDistractedSeconds } = sessionPerformance

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-gray-400" />
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Focus Session Performance</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-400">Study time</p>
            <p className="font-semibold text-gray-800">{formatDuration(studySeconds)}</p>
          </div>
          <div>
            <p className="text-gray-400">Focus score</p>
            <p className="font-semibold text-gray-800">{focusScore ?? 100}%</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400">Time distracted</p>
            <p className="font-semibold text-gray-800">{formatDuration(totalDistractedSeconds)}</p>
          </div>
        </div>

        {!hadDistractions ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            No distractions were recorded during this session.
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-700">{breakdownText}</p>
            {distractions?.length > 0 && (
              <ul className="flex flex-col gap-2">
                {distractions.map((item, index) => (
                  <li
                    key={`${item.reason}-${item.detectedAt ?? index}`}
                    className="text-xs text-gray-700 bg-white border border-gray-100 rounded-lg px-3 py-2"
                  >
                    <span className="font-semibold text-[#8B1A4A]">{item.label}</span>
                    {item.durationSeconds > 0 && (
                      <span className="text-gray-500"> · {formatDuration(item.durationSeconds)}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function NoteModal({ open, onClose, doc }) {
  if (!open || !doc) return null

  const taskName = doc.task?.taskName ?? 'Untitled Task'
  const subject  = doc.task?.subject  ?? ''
  const label    = `${subject ? subject + ' – ' : ''}${taskName}`
  const sessionPerformance = doc.sessionPerformance ?? doc.ai_details?.sessionPerformance ?? null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-400/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#8B1A4A]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Parent Report</p>
              <p className="text-sm font-bold text-gray-800 truncate max-w-[300px]">{label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            doc.ai_verified ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {doc.ai_verified
              ? <><CheckCircle className="w-3 h-3" /> REVIEWED</>
              : <><AlertCircle className="w-3 h-3" /> WAITING REVIEW</>
            }
          </span>
          {doc.created_at && (
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />
              {new Date(doc.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </span>
          )}
          {sessionPerformance && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-[#8B1A4A]">
              <Target className="w-3 h-3" />
              {sessionPerformance.focusScore ?? 100}% FOCUS
            </span>
          )}
        </div>

        <DistractionList sessionPerformance={sessionPerformance} />

        {doc.sessionNarrative && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Session Summary</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">{doc.sessionNarrative}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Document Review</p>
          </div>
          <div className={`rounded-xl p-4 border ${
            doc.ai_verified
              ? 'bg-green-50 border-green-100'
              : 'bg-amber-50 border-amber-100'
          }`}>
            <p className="text-sm text-gray-700 leading-relaxed">
              {doc.ai_feedback ?? 'No feedback available yet.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Generated by Basira AI
          </p>
          <button onClick={onClose} className="text-xs font-semibold text-[#8B1A4A] hover:underline">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
