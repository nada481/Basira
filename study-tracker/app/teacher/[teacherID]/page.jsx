'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, LayoutDashboard, ClipboardList, BookOpen, Users, Search, Bell, ChevronLeft, ChevronRight } from 'lucide-react'
import StudentRow from '@/components/StudentRow'
import {
  getTeacherProfile,
  getStudentsByTeacher,
  getClassOverviewStats,
  getStudentFocusScore,
  getStudentLastActive,
} from '@/services/teacherService'

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard },
  { label: 'Assignments', icon: ClipboardList },
  { label: 'Curriculum',  icon: BookOpen },
  { label: 'Students',    icon: Users },
]

const PAGE_SIZE = 10

export default function TeacherStudentsPage({ params }) {
  const { teacherId } = params
  const router = useRouter()

  const [menuOpen, setMenuOpen]     = useState(false)
  const [teacher, setTeacher]       = useState(null)
  const [grouped, setGrouped]       = useState({})   // { className: { classId, students[] } }
  const [stats, setStats]           = useState(null)
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(0)
  const [loading, setLoading]       = useState(true)
  const [activeNav, setActiveNav]   = useState('Students')

  useEffect(() => {
    async function load() {
      try {
        const [profile, groupedData, overviewStats] = await Promise.all([
          getTeacherProfile(teacherId),
          getStudentsByTeacher(teacherId),
          getClassOverviewStats(teacherId),
        ])

        // Enrich each student with focus score + last active
        for (const className of Object.keys(groupedData)) {
          groupedData[className].students = await Promise.all(
            groupedData[className].students.map(async (s) => {
              const [focusScore, activity] = await Promise.all([
                getStudentFocusScore(s.id),
                getStudentLastActive(s.id),
              ])
              return { ...s, focusScore, ...activity }
            })
          )
        }

        setTeacher(profile)
        setGrouped(groupedData)
        setStats(overviewStats)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [teacherId])

  // Flatten all students for search + pagination
  const allStudents = Object.entries(grouped).flatMap(([className, { students }]) =>
    students.map(s => ({ ...s, className }))
  )

  const filtered = allStudents.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.full_name ?? s.display_name ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    )
  })

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const teacherName    = teacher?.display_name ?? teacher?.full_name ?? 'Teacher'
  const teacherInitials = teacherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`
        fixed lg:static top-0 left-0 h-full w-56 bg-white border-r border-gray-100 z-50
        flex flex-col transition-transform duration-300
        ${menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Teacher profile */}
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-[#8B1A4A] text-white text-sm font-bold flex items-center justify-center">
              {teacherInitials}
            </div>
            <div>
              <p className="text-sm font-bold text-[#8B1A4A]">{teacherName}</p>
              <p className="text-xs text-gray-400">Lead Educator • Grade 5</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => { setActiveNav(item.label); setMenuOpen(false) }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeNav === item.label ? 'bg-[#8B1A4A] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Close on mobile */}
        <button onClick={() => setMenuOpen(false)} className="lg:hidden absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-screen">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-[#8B1A4A]">Student Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                placeholder="Search students..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20 w-56"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 px-6 py-6 flex flex-col gap-6">

          {/* Class overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Class Overview</h2>
                <p className="text-xs text-gray-400">{stats?.totalStudents ?? '—'} Active Students in Grade 5-A</p>
              </div>
              <div className="flex gap-2">
                <button className="border border-[#8B1A4A] text-[#8B1A4A] text-xs font-bold px-4 py-2 rounded-xl hover:bg-pink-50 transition-colors">
                  Manage Groups
                </button>
                <button className="bg-[#8B1A4A] hover:bg-[#C4526A] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
                  + Add Student
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Avg Focus Score */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Avg. Focus Score</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats ? `${Math.round((allStudents.reduce((s, st) => s + (st.focusScore ?? 0), 0) / Math.max(allStudents.length, 1)))}%` : '—'}
                </p>
                <p className="text-xs text-green-500 font-semibold mt-1">↑ +2%</p>
              </div>

              {/* Active Now */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Active Now</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stats ? `${stats.activeNow}/${stats.totalStudents}` : '—'}
                </p>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: Math.min(stats?.activeNow ?? 0, 5) }).map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
                  ))}
                </div>
              </div>

              {/* Assignments Due */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Assignments Due</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.assignmentsDue ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Student table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_2fr_auto] px-4 py-3 bg-gray-50 border-b border-gray-100">
              {['Student Name', 'Grade', 'Last Active', 'Focus Score', 'Actions'].map(h => (
                <span key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading students...</div>
            ) : paginated.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">No students found.</div>
            ) : (
              paginated.map(student => (
                <StudentRow
                  key={student.id}
                  student={student}
                  grade="Grade 5"
                  onViewReport={(id) => router.push(`/teacher/${teacherId}/report/${id}`)}
                />
              ))
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-[#8B1A4A] font-medium">
                Showing {Math.min(paginated.length, PAGE_SIZE)} of {filtered.length} students
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}