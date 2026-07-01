'use client'

import { use, useState, useEffect } from 'react'
import {
  TrendingUp, Target, MessageSquare, Clock,
  FileText, ExternalLink, Calculator, Globe,
  FlaskConical, BookOpen, Microscope, History,
  Music, Palette, Code, BookMarked, Sparkles,
} from 'lucide-react'
import Sidebar from '@/components/shared/Sidebar'
import NoteModal from '@/components/NoteModal'

const FILTERS = ['All', 'This Week', 'This Month']

const SUBJECT_ICON_MAP = [
  { keywords: ['math', 'calcul', 'fraction', 'algebra'], icon: Calculator,    bg: 'bg-blue-50',    color: 'text-blue-500' },
  { keywords: ['arabic', 'language', 'linguist', 'poetry'], icon: Globe,      bg: 'bg-emerald-50', color: 'text-emerald-500' },
  { keywords: ['chemistry', 'ionic', 'chemical'],           icon: FlaskConical, bg: 'bg-purple-50', color: 'text-purple-500' },
  { keywords: ['history', 'silk', 'modern'],                icon: History,     bg: 'bg-amber-50',   color: 'text-amber-500' },
  { keywords: ['biology', 'bio', 'cell'],                   icon: Microscope,  bg: 'bg-green-50',   color: 'text-green-500' },
  { keywords: ['music'],                                    icon: Music,       bg: 'bg-pink-50',    color: 'text-pink-500' },
  { keywords: ['art', 'design', 'draw'],                    icon: Palette,     bg: 'bg-rose-50',    color: 'text-rose-500' },
  { keywords: ['code', 'program', 'computer'],              icon: Code,        bg: 'bg-sky-50',     color: 'text-sky-500' },
  { keywords: ['english', 'literature', 'reading'],         icon: BookOpen,    bg: 'bg-indigo-50',  color: 'text-indigo-500' },
]

function getSubjectStyle(subject) {
  const key = (subject ?? '').toLowerCase()
  for (const entry of SUBJECT_ICON_MAP) {
    if (entry.keywords.some(k => key.includes(k))) return entry
  }
  return { icon: BookMarked, bg: 'bg-pink-50', color: 'text-[#8B1A4A]' }
}

function formatFocus(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m Focus Time`
  return `${m}m Focus Time`
}

export default function ProgressPage({ params }) {
  const { childId } = use(params)

  const [filter, setFilter]       = useState('All')
  const [documents, setDocuments] = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const filterParam = filter === 'This Week' ? 'week' : filter === 'This Month' ? 'month' : 'all'
        const res = await fetch(`/api/documents?filter=${filterParam}`, {
          headers: { 'x-user-id': childId },
        })
        if (!res.ok) throw new Error('Failed to load reports')
        const data = await res.json()
        setDocuments(data.documents ?? [])
        setStats(data.stats ?? null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [childId, filter])

  return (
    <main className="w-full px-8 py-6">

      <div className="flex items-center gap-3 mb-1">
        <Sidebar />
        <h1 className="text-3xl font-bold text-[#8B1A4A]">Parent Reports</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Review your child's academic progress, focus statistics, and teacher feedback.
      </p>

      {/* Filter tabs */}
      <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === f
                ? 'border-[#8B1A4A] text-[#8B1A4A]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-pink-50 text-[#880e4f] text-sm">{error}</div>
      )}

      {/* Document list */}
      <div className="flex flex-col gap-3 mb-10">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded w-48 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-32" />
              </div>
            </div>
          ))
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No reports found.</p>
        ) : (
          documents.map(doc => {
            const taskName = doc.task?.taskName ?? 'Untitled Task'
            const subject  = doc.task?.subject  ?? ''
            const reviewed = doc.ai_verified === true
            const label    = `${subject ? subject + ' – ' : ''}${taskName}`
            const { icon: SubjectIcon, bg, color } = getSubjectStyle(subject)

            return (
              <div
                key={doc.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <SubjectIcon className={`w-5 h-5 ${color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{formatFocus(doc.focusSeconds ?? 0)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      reviewed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {reviewed ? 'REVIEWED' : 'WAITING REVIEW'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {doc.ai_feedback && (
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#8B1A4A] transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      View Note
                    </button>
                  )}
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#8B1A4A] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Submission Document
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom stat cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <TrendingUp className="w-5 h-5 text-[#8B1A4A]" />
            <p className="text-sm font-bold text-gray-800">Weekly Growth</p>
            <p className="text-xs text-gray-400">
              {stats.newThisWeek} new submission{stats.newThisWeek !== 1 ? 's' : ''} this week.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-center text-center">
            <Target className="w-5 h-5 text-[#8B1A4A]" />
            <p className="text-sm font-bold text-gray-800">Focus Metrics</p>
            <p className="text-xs text-gray-400">
              {stats.reviewed} of {stats.total} submissions reviewed.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <MessageSquare className="w-5 h-5 text-[#8B1A4A]" />
            <p className="text-sm font-bold text-gray-800">Teacher Feedback</p>
            <p className="text-xs text-gray-400">
              {stats.withFeedback} detailed note{stats.withFeedback !== 1 ? 's' : ''} added.
            </p>
          </div>
        </div>
      )}

      <NoteModal
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        doc={selectedDoc}
      />

    </main>
  )
}