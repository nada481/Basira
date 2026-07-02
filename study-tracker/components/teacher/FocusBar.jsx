export default function FocusBar({ score }) {
  const color = score >= 80 ? 'bg-[#8B1A4A]' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700">{score}</span>
    </div>
  )
}