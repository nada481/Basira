'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { getTodayReport, getDailyStats, getMonthlyStats, getYearlyStats } from '@/services/reportService'
import { getStudentName } from '@/services/profileService'

const TABS = ['Daily', 'Monthly', 'Yearly']

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function StatCard({ label, value, icon: Icon, sub, color = 'text-[#8B1A4A]' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-gray-300" />}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function BarChart({ data, labelKey, valueKey, color = '#8B1A4A' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${Math.max((d[valueKey] / max) * 80, 2)}px`, backgroundColor: color, opacity: d[valueKey] ? 1 : 0.2 }}
          />
          <span className="text-[9px] text-gray-400">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportPage({ params }) {
  const { studentId } = params
  const router = useRouter()

  const [tab, setTab]               = useState('Daily')
  const [studentName, setStudentName] = useState('')
  const [narrative, setNarrative]   = useState(null)
  const [generating, setGenerating] = useState(false)
  const [daily, setDaily]           = useState(null)
  const [monthly, setMonthly]       = useState(null)
  const [yearly, setYearly]         = useState(null)
  const [loading, setLoading]       = useState(true)

  const now   = new Date()
  const today = now.toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      try {
        const [name, report, dailyStats, monthlyStats, yearlyStats] = await Promise.all([
          getStudentName(studentId),
          getTodayReport(studentId),
          getDailyStats(studentId, today),
          getMonthlyStats(studentId, now.getFullYear(), now.getMonth() + 1),
          getYearlyStats(studentId, now.getFullYear()),
        ])
        setStudentName(name)
        setNarrative(report?.narrative ?? null)
        setDaily(dailyStats)
        setMonthly(monthlyStats)
        setYearly(yearlyStats)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studentId])

  async function generateReport() {
    setGenerating(true)
    try {
      const res  = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      setNarrative(data.report?.narrative ?? null)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  // Monthly chart data
  const monthlyChartData = monthly
    ? Object.entries(monthly.byDay).slice(-14).map(([day, secs]) => ({
        label: day.slice(8), // day number
        value: Math.round(secs / 60), // minutes
      }))
    : []

  // Yearly chart data
  const yearlyChartData = yearly
    ? yearly.byMonth.map((m, i) => ({
        label: MONTH_NAMES[i],
        value: Math.round(m.seconds / 3600), // hours
      }))
    : []

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#8B1A4A]">{studentName || 'Student'} — Progress Report</h1>
          <p className="text-xs text-gray-400">{today}</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── AI Narrative note ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">Today's Session Note</h2>
            <button
              onClick={generateReport}
              disabled={generating}
              className="text-xs font-bold bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-50 text-white px-4 py-1.5 rounded-xl transition-colors"
            >
              {generating ? 'Generating...' : narrative ? 'Regenerate' : 'Generate Report'}
            </button>
          </div>

          {narrative ? (
            <p className="text-sm text-gray-700 leading-relaxed bg-pink-50 border border-pink-100 rounded-xl p-4">
              {narrative}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No report yet for today. Click "Generate Report" at the end of the day.
            </p>
          )}
        </div>

        {/* ── Tab switcher ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-2xl p-1 shadow-sm self-start">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm font-semibold px-5 py-2 rounded-xl transition-colors ${
                tab === t ? 'bg-[#8B1A4A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading stats...</p>
        ) : (
          <>
            {/* ── Daily ───────────────────────────────────────────────────────── */}
            {tab === 'Daily' && daily && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Focus Time"    value={formatTime(daily.totalFocusSeconds)} icon={Clock} />
                  <StatCard label="Total Distracted"    value={formatTime(daily.totalDistracted)}   icon={AlertTriangle} color="text-orange-500" />
                  <StatCard label="Sessions Completed"  value={daily.sessions.length}               icon={CheckCircle} color="text-green-600" />
                  <StatCard label="Stuck Pages"         value={daily.stuckPages.length}             icon={Calendar} color="text-red-500" />
                </div>

                {/* Distraction breakdown */}
                {Object.keys(daily.distractionBreakdown).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Distraction Breakdown</h3>
                    <div className="flex flex-col gap-2">
                      {Object.entries(daily.distractionBreakdown).map(([reason, secs]) => {
                        const label = {
                          phone_detected:  'Phone Detected',
                          not_writing:     'Not Facing Device',
                          talking:         'Talking',
                          off_task_screen: 'Off-Task Screen',
                        }[reason] ?? reason
                        const pct = daily.totalDistracted > 0
                          ? Math.round((secs / daily.totalDistracted) * 100) : 0
                        return (
                          <div key={reason} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-36">{label}</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#8B1A4A] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-600 w-10 text-right">{formatTime(secs)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {daily.tasks.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Tasks Today</h3>
                    <div className="flex flex-col gap-2">
                      {daily.tasks.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{t.tasks?.title ?? 'Unknown'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">{formatTime(t.time_spent)}</span>
                            {t.overtime_triggered && (
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">OVERTIME</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stuck pages */}
                {daily.stuckPages.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Stuck Pages</h3>
                    <div className="flex flex-col gap-3">
                      {daily.stuckPages.map((p, i) => (
                        <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3">
                          <p className="text-xs font-bold text-red-600 mb-0.5">Page {p.page_number} — {formatTime(p.time_spent_seconds)}</p>
                          {p.ai_diagnosis && <p className="text-xs text-gray-600">{p.ai_diagnosis}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Monthly ─────────────────────────────────────────────────────── */}
            {tab === 'Monthly' && monthly && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Focus Time"   value={formatTime(monthly.totalSeconds)}    icon={Clock} />
                  <StatCard label="Avg Focus Score"    value={`${monthly.focusScore}%`}            icon={TrendingUp} color="text-green-600" />
                  <StatCard label="Total Distracted"   value={formatTime(monthly.totalDistracted)} icon={AlertTriangle} color="text-orange-500" />
                </div>

                {/* Daily chart */}
                {monthlyChartData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Focus Time (last 14 days, mins)</h3>
                    <BarChart data={monthlyChartData} labelKey="label" valueKey="value" />
                  </div>
                )}

                {/* Subject breakdown */}
                {Object.keys(monthly.subjectTime).length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Time by Subject</h3>
                    <div className="flex flex-col gap-2">
                      {Object.entries(monthly.subjectTime)
                        .sort(([,a],[,b]) => b - a)
                        .map(([subject, secs]) => (
                          <div key={subject} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{subject}</span>
                            <span className="font-semibold text-[#8B1A4A]">{formatTime(secs)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Yearly ──────────────────────────────────────────────────────── */}
            {tab === 'Yearly' && yearly && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Study Hours"  value={`${Math.round(yearly.totalSeconds / 3600)}h`} icon={Clock} />
                  <StatCard label="Completion Rate"    value={`${yearly.completionRate}%`}                  icon={CheckCircle} color="text-green-600" />
                  <StatCard label="Overtime Sessions"  value={yearly.totalOvertimes}                        icon={AlertTriangle} color="text-orange-500" />
                </div>

                {/* Monthly chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">Study Hours by Month</h3>
                  <BarChart data={yearlyChartData} labelKey="label" valueKey="value" />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}