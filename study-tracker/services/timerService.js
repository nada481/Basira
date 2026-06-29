import { supabase } from '@/lib/supabase'

export async function startTimer({ userId, taskId }) {
  const { data, error } = await supabase
    .from('timer')
    .insert({
      userID:     userId,
      task_id:    taskId,
      start_time: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data // returns the timer row including its id (used as sessionId)
}

export async function stopTimer({ timerId, totalSeconds }) {
  const { error } = await supabase
    .from('timer')
    .update({
      finish_time:   new Date().toISOString(),
      total_seconds: totalSeconds,
    })
    .eq('id', timerId)

  if (error) throw new Error(error.message)
}

export async function getActiveTimer(userId) {
  const { data, error } = await supabase
    .from('timer')
    .select('*')
    .eq('userID', userId)
    .is('finish_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .single()

  if (error) throw new Error(error.message)
  return data ?? null
}

export async function getTimerHistory(userId) {
  const { data, error } = await supabase
    .from('timer')
    .select(`
      *,
      tasks ( taskName, subject )
    `)
    .eq('userID', userId)
    .order('start_time', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// Get total study time for a user (in seconds)
export async function getTotalStudyTime(userId) {
  const { data, error } = await supabase
    .from('timer')
    .select('total_seconds')
    .eq('userID', userId)
    .not('total_seconds', 'is', null)

  if (error) throw new Error(error.message)
  return data.reduce((sum, row) => sum + (row.total_seconds ?? 0), 0)
}

//calculate the total study time for a specific task (in seconds)
export async function getTotalStudyTimeForTask(userId, taskId) {
    const { data, error } = await supabase
        .from('timer')
        .select('total_seconds')
        .eq('userID', userId)
        .eq('task_id', taskId)
        .not('total_seconds', 'is', null)

    if (error) throw new Error(error.message)
    return data.reduce((sum, row) => sum + (row.total_seconds ?? 0), 0)
}