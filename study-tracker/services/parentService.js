import { supabase } from '@/lib/supabase'



export async function getLinkedChildren(parentId) {
  console.log("parentId:", parentId);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_id', parentId);

  if (error) throw new Error(error.message);

  return data;
}

// ── Get today's study time for a child (in seconds) ───────────────────────────
export async function getChildTodayTime(childId) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('timer')
    .select('total_seconds, finish_time, start_time')
    .eq('userID', childId)
    .gte('start_time', startOfDay.toISOString())

  if (error) throw new Error(error.message)

  return data.reduce((sum, row) => {
    if (row.total_seconds) return sum + row.total_seconds
    // still active — calculate from start_time
    if (!row.finish_time) {
      const elapsed = Math.floor((Date.now() - new Date(row.start_time)) / 1000)
      return sum + elapsed
    }
    return sum
  }, 0)
}

export async function linkChildByEmail(parentId, childEmail) {
  const { data: child, error: findError } = await supabase
    .from('profiles')
    .select('id, full_name, parent_id')
    .eq('email', childEmail)
    .single()

  if (findError || !child) throw new Error('Student not found with that email.')
  if (child.parent_id) throw new Error('Student is already linked to a parent.')

  
  const { error } = await supabase
    .from('profiles')
    .update({ parent_id: parentId })
    .eq('id', child.id)

  if (error) throw new Error(error.message)
  return child
}

// ── Get progress report summary for a child ───────────────────────────────────
export async function getChildProgressReport(childId) {
  // Stuck pages
  const { data: stuckPages, error: stuckError } = await supabase
    .from('page_tracking')
    .select('page_number, time_spent_seconds, ai_diagnosis, ai_material_suggestion, notified_at')
    .eq('userID', childId)
    .eq('got_stuck', true)
    .order('notified_at', { ascending: false })
    .limit(5)

  if (stuckError) throw new Error(stuckError.message)

  const { data: overTimeTasks, error: overtimeError } = await supabase
    .from('task_sessions')
    .select('task_id, time_spent, created_at, tasks(title, subject)')
    .eq('user_id', childId)
    .eq('overtime_triggered', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (overtimeError) throw new Error(overtimeError.message)

  const { data: screenNotes, error: screenError } = await supabase
    .from('focus_events')
    .select('screen_note, detected_at')
    .eq('user_id', childId)
    .eq('screen_flagged', true)
    .order('detected_at', { ascending: false })
    .limit(5)

  if (screenError) throw new Error(screenError.message)

  return { stuckPages, overTimeTasks, screenNotes }
}

export async function getChildEffortLevel(childId) {
  const { data, error } = await supabase
    .from('focus_events')
    .select('distraction_duration')
    .eq('userID', childId)
    .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (error) throw new Error(error.message)

  const totalDistracted = (data ?? []).reduce((s, r) => s + (r.distraction_duration ?? 0), 0)

  if (totalDistracted < 60)  return 'High'
  if (totalDistracted < 300) return 'Medium'
  return 'Low'
}