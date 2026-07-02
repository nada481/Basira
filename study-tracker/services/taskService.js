import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function getTasksByStudent(userID) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, classes(id, name)')   // join in class info if useful
    .eq('userID', userID)

  if (error) throw new Error(error.message)
  return data
}

export async function getTaskById(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, classes(id, name)')
    .eq('id', taskId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createTask({ userID, taskName, subject, type, note, classId, estimatedMinutes, dueDate }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      userID,
      taskName,
      subject,
      type,
      note,
      class_id: classId ?? null,
      estimated_minutes: estimatedMinutes ?? null,
      due_date: dueDate ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateTask(taskId, updates) {
  // whitelist so callers can't overwrite arbitrary columns
  const allowed = ['taskName', 'subject', 'type', 'note', 'class_id', 'estimated_minutes', 'due_date', 'status']
  const payload = {}
  for (const key of allowed) {
    if (key in updates) payload[key] = updates[key]
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function completeTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'complete' })
    .eq('id', taskId)

  if (error) throw new Error(error.message)
}

export async function markTaskOvertime(taskId) {
  const { error } = await supabase
    .from('tasks')
    .update({ TaskOvertime: true })
    .eq('id', taskId)

  if (error) throw new Error(error.message)
}

export async function logTaskSession({ taskId, userID, timeSpent, overtimeTriggered }) {
  const { error } = await supabase
    .from('task_sessions')
    .insert({
      Id: taskId,
      userID: userID,
      time_spent: timeSpent,
      overtime_triggered: overtimeTriggered,
      created_at: new Date().toISOString(),
    })

  if (error) throw new Error(error.message)
}