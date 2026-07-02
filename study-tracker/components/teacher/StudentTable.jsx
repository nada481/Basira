import { ChevronLeft, ChevronRight } from 'lucide-react'
import StudentRow from './StudentRow'

const PAGE_SIZE = 10

export default function StudentTable({ students, loading, page, onPageChange, onSelectStudent }) {
  const totalPages = Math.ceil(students.length / PAGE_SIZE)
  const paginated  = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Student Name</th>
            <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Grade</th>
            <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Last Active</th>
            <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Focus Score</th>
            <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50 animate-pulse">
                <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded w-32" /></td>
                <td className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-16" /></td>
                <td className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-20" /></td>
                <td className="px-4 py-4"><div className="h-3 bg-gray-100 rounded w-24" /></td>
                <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded w-20 ml-auto" /></td>
              </tr>
            ))
          ) : paginated.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center text-sm text-gray-400 py-10">
                No students found.
              </td>
            </tr>
          ) : (
            paginated.map(student => (
              <StudentRow key={student.id} student={student} onSelect={() => onSelectStudent?.(student)} />
            ))
          )}
        </tbody>
      </table>

      {!loading && students.length > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, students.length)}–{Math.min(page * PAGE_SIZE, students.length)} of {students.length} students
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}