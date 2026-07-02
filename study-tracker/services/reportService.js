// create the report from the ai, get report based onn the session info time, etc, get weekly report, monthly report, yearly report maybe in
// a clander or sth ?
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { getTasksByStudent } from '@/services/taskService'
import { getTotalDistractionTime, getDistractionBreakdown, getScreenNotes } from '@/services/focusService'
import { getStuckPages, getPageProgress } from '@/services/pageTrackingService'
import { getTimerHistory, getTotalStudyTime } from '@/services/timerService'

export async function saveReport({ studentId, narrative }) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reports')
    .upsert(
      { student_id: studentId, narrative, report_date: today, generated_at: new Date().toISOString() },
      { onConflict: 'student_id, report_date' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Get today's saved report:
export async function getTodayReport(studentId) {
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('student_id', studentId)
    .eq('report_date', today)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  return data ?? null
}

// Get report history (monthly/yearly view)
export async function getReportHistory(studentId, { from, to } = {}) {
  let query = supabase
    .from('reports')
    .select('id, narrative, report_date, generated_at')
    .eq('student_id', studentId)
    .order('report_date', { ascending: false })

  if (from) query = query.gte('report_date', from)
  if (to)   query = query.lte('report_date', to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

// Collect all data needed for the report  
export async function collectReportData(studentId, sessionId) {
  const [
    tasks,
    timerHistory,
    totalStudyTime,
    totalDistracted,
    distractionBreakdown,
    screenNotes,
    stuckPages,
    pageProgress,
  ] = await Promise.all([
    getTasksByStudent(studentId),
    getTimerHistory(studentId),
    getTotalStudyTime(studentId),
    getTotalDistractionTime(sessionId),
    getDistractionBreakdown(sessionId),
    getScreenNotes(sessionId),
    getStuckPages({ userId: studentId, session_id: sessionId }),
    getPageProgress({ userId: studentId, session_id: sessionId }),
  ])

  return {
    tasks,
    timerHistory,
    totalStudyTime,
    totalDistracted,
    distractionBreakdown,
    screenNotes,
    stuckPages,
    pageProgress,
  }
}

export async function getMonthlyStats(studentId, year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to   = new Date(year, month, 0).toISOString().split('T')[0]

  const { data: timerData } = await supabase
    .from('timer')
    .select('total_seconds, start_time, tasks(subject)')
    .eq('userID', studentId)
    .gte('start_time', `${from}T00:00:00.000Z`)
    .lte('start_time', `${to}T23:59:59.999Z`)
    .not('total_seconds', 'is', null)

  const { data: focusData } = await supabase
    .from('focus_events')
    .select('distraction_duration, detected_at')
    .eq('userID', studentId)
    .gte('detected_at', `${from}T00:00:00.000Z`)
    .lte('detected_at', `${to}T23:59:59.999Z`)

  const byDay = {}
  for (const row of timerData ?? []) {
    const day = row.start_time.split('T')[0]
    byDay[day] = (byDay[day] ?? 0) + (row.total_seconds ?? 0)
  }

  const totalSeconds    = (timerData ?? []).reduce((s, r) => s + (r.total_seconds ?? 0), 0)
  const totalDistracted = (focusData  ?? []).reduce((s, r) => s + (r.distraction_duration ?? 0), 0)
  const focusScore      = totalSeconds > 0
    ? Math.max(0, Math.round(100 - (totalDistracted / totalSeconds) * 100))
    : 100

  const subjectTime = {}
  for (const row of timerData ?? []) {
    const subject = row.tasks?.subject ?? 'Unknown'
    subjectTime[subject] = (subjectTime[subject] ?? 0) + (row.total_seconds ?? 0)
  }

  return { totalSeconds, totalDistracted, focusScore, byDay, subjectTime }
}