import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import {
  getDistractionLabel,
  buildSessionPerformanceSummary,
} from '@/lib/sessionPerformance'

// Create a new focus event (called every time AI detects distraction)
export async function logFocusEvent({
  sessionId,
  userId,
  reason,
  distractionDuration,
  totalDistracted,
  screenNote,
  screenFlagged,
}) {
  const { error } = await supabase
    .from('focus_events')
    .insert({
      session_id:           sessionId,
      userID:                userId,
      distraction_reason:   reason,
      distraction_duration: distractionDuration,
      total_distracted:     totalDistracted,
      screen_note:          screenNote   ?? null,
      screen_flagged:       screenFlagged ?? false,
      detected_at:          new Date().toISOString(),
    })

  if (error) throw new Error(error.message)
}

// get focus event by session
export async function getFocusEventsBySession(sessionId) {
  const { data, error } = await supabase
    .from('focus_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('detected_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

// Get total distraction time for a session
export async function getTotalDistractionTime(sessionId) {
  const { data, error } = await supabase
    .from('focus_events')
    .select('distraction_duration')
    .eq('session_id', sessionId)

  if (error) throw new Error(error.message)

  return data.reduce((sum, row) => sum + (row.distraction_duration ?? 0), 0)
}

//Get distraction breakdown by reason for a session
export async function getDistractionBreakdown(sessionId) {
  const { data, error } = await supabase
    .from('focus_events')
    .select('distraction_reason, distraction_duration')
    .eq('session_id', sessionId)
    .not('distraction_reason', 'is', null)

  if (error) throw new Error(error.message)

  // { phone_detected: 30, not_writing: 60, talking: 15 }
  return data.reduce((acc, row) => {
    const key = row.distraction_reason
    acc[key] = (acc[key] ?? 0) + (row.distraction_duration ?? 0)
    return acc
  }, {})
}

//Get all screen notes for a session
export async function getScreenNotes(sessionId) {
  const { data, error } = await supabase
    .from('focus_events')
    .select('screen_note, detected_at')
    .eq('session_id', sessionId)
    .eq('screen_flagged', true)
    .order('detected_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

/** Structured focus/study session stats for parent reports. */
export async function getSessionPerformance(sessionId) {
  if (!sessionId) return null

  const [events, totalDistracted, breakdown, timerResult] = await Promise.all([
    getFocusEventsBySession(sessionId),
    getTotalDistractionTime(sessionId),
    getDistractionBreakdown(sessionId),
    supabase
      .from('timer')
      .select('total_seconds, start_time, finish_time')
      .eq('id', sessionId)
      .maybeSingle(),
  ])

  if (timerResult.error) throw new Error(timerResult.error.message)

  const studySeconds = timerResult.data?.total_seconds ?? 0

  const distractions = (events ?? []).map((row) => ({
    reason: row.distraction_reason,
    label: getDistractionLabel(row.distraction_reason),
    durationSeconds: row.distraction_duration ?? 0,
    detectedAt: row.detected_at,
    screenNote: row.screen_note ?? null,
  }))

  return buildSessionPerformanceSummary({
    studySeconds,
    totalDistractedSeconds: totalDistracted,
    distractionBreakdown: breakdown,
    distractions,
  })
}