'use client'

import { useState, useEffect } from 'react'
import { Bell, Star, Clock, Target, BarChart2, Flame, Sunrise, BookMarked, Trophy, Rocket } from 'lucide-react'
import PortalSidebar, { MenuButton } from '@/components/shared/PortalSidebar'
import { STUDENT_NAV } from '@/lib/portalNav'
import { DEMO_STUDENT_ID as STUDENT_ID } from '@/lib/demoUsers'
import GrowthStatCard    from '@/components/growth/GrowthStatCard'
import LineChart         from '@/components/charts/LineChart'
import SubjectProgress   from '@/components/growth/SubjectProgress'
import AchievementBadges from '@/components/growth/AchievementBadges'
import NextGoal          from '@/components/growth/NextGoal'

export default function GrowthPage() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [loading, setLoading]     = useState(true)
  const [profile, setProfile]     = useState(null)
  const [totalSeconds, setTotal]  = useState(0)
  const [tasks, setTasks]         = useState([])
  const [monthly, setMonthly]     = useState(null)
  const [chartData, setChartData] = useState([])
  const [studyStreak, setStreak]  = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [profRes, growthRes] = await Promise.all([
          fetch('/api/profile', { headers: { 'x-user-id': STUDENT_ID } }).then(r => r.json()),
          fetch('/api/growth',  { headers: { 'x-user-id': STUDENT_ID } }).then(r => r.json()),
        ])

        setProfile(profRes.profile)
        setTotal(growthRes.totalSeconds ?? 0)
        setTasks(growthRes.tasks ?? [])
        setMonthly(growthRes.monthlyStats ?? null)

        // Build chart from timer history — group seconds by date
        const history = growthRes.timerHistory ?? []
        const byDay = {}
        for (const row of history) {
          if (!row.start_time) continue
          const day = row.start_time.split('T')[0]
          byDay[day] = (byDay[day] ?? 0) + (row.total_seconds ?? 0)
        }

        // Last 7 days that have data
        const chartEntries = Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, secs]) => ({ label: date.slice(5), value: Math.round(secs / 60) }))

        setChartData(chartEntries)

        // Streak from timer history
        const days = [...new Set(history.map(r => r.start_time?.split('T')[0]).filter(Boolean))].sort().reverse()
        let streak = 0
        let expected = new Date()
        for (const day of days) {
          const diff = Math.round((expected - new Date(day)) / 86400000)
          if (diff <= 1) { streak++; expected = new Date(day) } else break
        }
        setStreak(streak)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const completed  = tasks.filter(t => t.completeTask).length
  const total      = tasks.length
  const progress   = total > 0 ? Math.round((completed / total) * 100) : 0
  const focusScore = monthly?.focusScore ?? 100
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const goalPct = Math.min(Math.round((h / 30) * 100), 100)

  const subjects = monthly?.subjectTime
    ? Object.entries(monthly.subjectTime)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, secs]) => {
          const max = Math.max(...Object.values(monthly.subjectTime))
          return { name, pct: Math.round((secs / max) * 100) }
        })
    : []

  const achievements = [
    { icon: Flame,      label: 'Week Warrior', sub: `${studyStreak} day streak`, earned: studyStreak >= 7 },
    { icon: Sunrise,    label: 'Early Bird',   sub: '5 AM study',                earned: false },
    { icon: BookMarked, label: 'Focus Master', sub: `${h}h focus`,               earned: h >= 10 },
    { icon: Target,     label: 'Goal Getter',  sub: `${completed} goals`,         earned: completed >= 5 },
    { icon: Trophy,     label: 'Top Student',  sub: `${progress}% done`,          earned: progress >= 80 },
  ]

  const studentName = profile?.display_name ?? profile?.full_name ?? 'Student'
  const initials    = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-white">

      <PortalSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navItems={STUDENT_NAV}
        profileName={studentName}
        profileRole="Student"
      />

      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MenuButton onClick={() => setMenuOpen(true)} />
          <div>
            <h1 className="text-lg font-bold text-[#8B1A4A]">Growth</h1>
            <p className="text-xs text-gray-400">Track your learning journey and achievements</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><Bell className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-800">{studentName}</p>
              <p className="text-xs text-gray-400">Student</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#8B1A4A] text-white text-sm font-bold flex items-center justify-center">{initials}</div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="px-8 py-6 flex flex-col gap-6">

          <div className="grid grid-cols-4 gap-4">
            <GrowthStatCard icon={Star}      label="Study Streak"   value={`${studyStreak} Days`}   sub="Keep it up!"      iconBg="bg-amber-50"  iconColor="text-amber-400"   subColor="text-gray-400" />
            <GrowthStatCard icon={Clock}     label="Total Study"    value={`${h}h ${m}m`}            sub="This month"       iconBg="bg-blue-50"   iconColor="text-blue-400"    subColor="text-gray-400" />
            <GrowthStatCard icon={Target}    label="Goals Achieved" value={`${completed}/${total}`}  sub="Tasks completed"  iconBg="bg-green-50"  iconColor="text-green-500"   subColor="text-gray-400" />
            <GrowthStatCard icon={BarChart2} label="Focus Score"    value={`${focusScore}%`}         sub={focusScore >= 80 ? 'Great progress!' : 'Keep going!'} iconBg="bg-pink-50" iconColor="text-[#8B1A4A]" subColor="text-green-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">Learning Growth</h2>
                <span className="text-xs font-semibold text-[#8B1A4A] bg-pink-50 px-3 py-1 rounded-full">This Month</span>
              </div>
              <LineChart data={chartData} />
              <p className="text-xs text-[#8B1A4A] text-center mt-2 font-medium flex items-center justify-center gap-1">
                <Rocket className="w-3 h-3" />
                You're making steady progress. Keep learning!
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">Subject Progress</h2>
              </div>
              <SubjectProgress subjects={subjects} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Achievements</h2>
              <AchievementBadges achievements={achievements} />
            </div>
            <NextGoal pct={goalPct} h={h} m={m} />
          </div>

        </div>
      )}
    </div>
  )
}