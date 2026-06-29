'use client'
 
export default function GrowthStatCard({ icon: Icon, label, value, sub, subColor = 'text-gray-400', iconBg = 'bg-gray-50', iconColor = 'text-gray-400' }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className={`text-[10px] font-semibold ${subColor}`}>{sub}</p>
      </div>
    </div>
  )
}
 