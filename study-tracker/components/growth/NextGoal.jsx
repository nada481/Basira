'use client'

import DonutChart from '../charts/DonutChart'

export default function NextGoal({ pct, h, m }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800">Next Goal</h2>
        <button className="text-xs text-[#8B1A4A] font-semibold hover:underline">Edit Goal</button>
      </div>
      <div className="flex items-center gap-5">
        <DonutChart pct={pct} />
        <div>
          <p className="text-sm font-bold text-gray-800">Study 30 hours this month</p>
          <p className="text-xs text-gray-400 mt-0.5">{h}h {m}m / 30h</p>
        </div>
      </div>
      <div className="mt-4 bg-pink-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
        <span className="text-sm">✨</span>
        <p className="text-xs text-[#8B1A4A] font-medium">
          {pct >= 100 ? 'Goal achieved! Amazing work!' : "You're almost there! Keep pushing forward."}
        </p>
      </div>
    </div>
  )
}