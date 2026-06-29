'use client'

export default function AchievementBadges({ achievements }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {achievements.map((a, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            a.earned ? 'bg-pink-50 border border-pink-100' : 'bg-gray-100'
          }`}>
            <a.icon className={`w-5 h-5 ${a.earned ? 'text-[#8B1A4A]' : 'text-gray-400'}`} />
          </div>
          <p className="text-[10px] font-bold text-gray-700 text-center leading-tight">{a.label}</p>
          <p className="text-[9px] text-gray-400 text-center">{a.sub}</p>
        </div>
      ))}
    </div>
  )
}