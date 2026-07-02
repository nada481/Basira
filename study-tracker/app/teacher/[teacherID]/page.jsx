'use client'

import { use, useState, useEffect } from 'react'
import { Bell, Search, Users, UserPlus, ClipboardPlus } from 'lucide-react'
import TeacherSidebar     from '@/components/teacher/TeacherSidebar'
import ClassStatCards     from '@/components/teacher/ClassStatCards'
import StudentTable       from '@/components/teacher/StudentTable'
import AddStudentModal    from '@/components/teacher/AddStudentModal'
import AddTaskModal       from '@/components/teacher/AddTaskModal'
import StudentDetailModal from '@/components/teacher/StudentDetailModal'

export default function TeacherPage({ params }) {
  const { teacherID } = use(params)

  const [activeNav, setActiveNav]   = useState('Students')
  const [profile, setProfile]       = useState(null)
  const [stats, setStats]           = useState(null)
  const [students, setStudents]     = useState([])
  const [classes, setClasses]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)

  const [showAddStudent, setShowAddStudent]   = useState(false)
  const [showAddTask, setShowAddTask]         = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  async function loadAll() {
    try {
      const [dashRes, studentsRes] = await Promise.all([
        fetch('/api/teacher?type=dashboard', { headers: { 'x-user-id': teacherID } }).then(r => r.json()),
        fetch('/api/teacher?type=students',  { headers: { 'x-user-id': teacherID } }).then(r => r.json()),
      ])
      setProfile(dashRes.profile)
      setStats(dashRes.stats)
      setStudents(studentsRes.students ?? [])
      setClasses(dashRes.classes ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [teacherID])

  const filtered = students.filter(s => {
    const name  = (s.full_name ?? s.display_name ?? '').toLowerCase()
    const email = (s.email ?? '').toLowerCase()
    const q     = search.toLowerCase()
    return name.includes(q) || email.includes(q)
  })

  return (
    <div className="min-h-screen bg-white flex">

      <TeacherSidebar
        profile={profile}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <main className="flex-1 flex flex-col">

        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-[#8B1A4A]">Student Management</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20 w-56"
              />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="px-8 py-6 flex flex-col gap-6">

          {/* Class overview */}
          <div>
            <p className="text-xs font-semibold text-gray-500">Class Overview</p>
            <p className="text-sm text-gray-400">
              {loading ? '...' : `${stats?.totalStudents ?? 0} Active Students in Grade 5-A`}
            </p>
          </div>

          <ClassStatCards stats={stats} loading={loading} />

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowAddTask(true)}
              className="px-4 py-2 text-sm font-semibold text-[#8B1A4A] border border-[#8B1A4A] rounded-xl hover:bg-pink-50 transition-colors flex items-center gap-2"
            >
              <ClipboardPlus className="w-4 h-4" /> Add Assignment
            </button>
            <button
              onClick={() => setShowAddStudent(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#8B1A4A] rounded-xl hover:bg-[#a32258] transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Student
            </button>
          </div>

          <StudentTable
            students={filtered}
            loading={loading}
            page={page}
            onPageChange={setPage}
            onSelectStudent={setSelectedStudent}
          />

        </div>
      </main>

      <AddStudentModal
        open={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        classes={classes}
        teacherId={teacherID}
        onSuccess={loadAll}
      />

      <AddTaskModal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        classes={classes}
        teacherId={teacherID}
        onSuccess={loadAll}
      />

      <StudentDetailModal
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        teacherId={teacherID}
      />

    </div>
  )
}