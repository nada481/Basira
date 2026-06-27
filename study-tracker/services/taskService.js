import {supabase} from '@/lib/supabase'
 
export async function getTasksByStudent(userID) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('userID', userID)
 
  if (error) throw new Error(error.message)
  return data
}
 
export async function getTaskById(taskId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
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
 
// for logging task sessions (time spent on a task) - more than the estimated time created by the teacher
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