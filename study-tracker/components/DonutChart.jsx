'use client'

export default function DonutChart({ pct }) {
  const r = 40, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
      <circle cx="50" cy="50" r={r} fill="none"
        stroke="#8B1A4A" strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#8B1A4A">{pct}%</text>
    </svg>
  )
}