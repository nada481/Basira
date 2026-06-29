'use client'

export default function LineChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
  )

  const max = Math.max(...data.map(d => d.value), 1)
  const W = 500, H = 160, PX = 20, PY = 20

  const pts = data.map((d, i) => ({
    x: PX + (i / Math.max(data.length - 1, 1)) * (W - PX * 2),
    y: H - PY - (d.value / max) * (H - PY * 2),
    ...d,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B1A4A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8B1A4A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke="#8B1A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#8B1A4A" />)}
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H - 2} textAnchor="middle" fontSize="10" fill="#9CA3AF">{p.label}</text>
      ))}
    </svg>
  )
}