import { TrendingUp, ClipboardCheck } from 'lucide-react'

export default function ClassStatCards({ stats, loading }) {
  return (
    <div className="grid grid-cols-3 gap-4">

      <div className="border border-gray-100 rounded-2xl p-5">
        <p className="text-xs text-gray-400 mb-2">Avg. Focus Score</p>
        <p className="text-3xl font-bold text-[#8B1A4A]">84%</p>
        <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3" /> +2%
        </p>
      </div>

      <div className="border border-gray-100 rounded-2xl p-5">
        <p className="text-xs text-gray-400 mb-2">Active Now</p>
        <p className="text-3xl font-bold text-[#8B1A4A]">
          {loading ? '—' : `${stats?.activeNow ?? 0}/${stats?.totalStudents ?? 0}`}
        </p>
        <div className="flex gap-1 mt-2">
          {Array.from({ length: Math.min(stats?.activeNow ?? 0, 5) }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-gray-300" />
          ))}
        </div>
      </div>

      <div className="border border-gray-100 rounded-2xl p-5">
        <p className="text-xs text-gray-400 mb-2">Assignments Due</p>
        <p className="text-3xl font-bold text-[#8B1A4A]">
          {loading ? '—' : stats?.assignmentsDue ?? 0}
        </p>
        <ClipboardCheck className="w-5 h-5 text-gray-300 mt-1" />
      </div>

    </div>
  )
}