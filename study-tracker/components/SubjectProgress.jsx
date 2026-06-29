'use client'

export default function SubjectProgress({ subjects }) {
  if (!subjects?.length) return (
    <p className="text-sm text-gray-400 text-center py-8">No subject data yet</p>
  )

  return (
    <div className="flex flex-col gap-4">
      {subjects.map(s => (
        <div key={s.name}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700 font-medium">{s.name}</span>
            <span className="text-sm font-bold text-gray-600">{s.pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#8B1A4A]" style={{ width: `${s.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}