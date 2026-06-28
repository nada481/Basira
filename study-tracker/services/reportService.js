// create the report from the ai, get report based onn the session info time, etc, get weekly report, monthly report, yearly report maybe in
// a clander or sth ?
import supabase from '@/lib/supabase'
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
    getStuckPages({ userId: studentId }),
    getPageProgress({ userId: studentId }),
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