import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

// ── 1. Parent name ─────────────────────────────────────────────────────────
export async function getParentName(parentId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, full_name, email')
    .eq('id', parentId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.display_name ?? data?.full_name ?? data?.email ?? 'Parent'
}

// ── 2. Children linked to this parent ───────────────────────────────────────
export async function getLinkedChildren(parentId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, email, avatar_url')
    .eq('parent_id', parentId)

  if (error) throw new Error(error.message)
  return data ?? []
}

// ── 3. Child's grade (parsed from class name, e.g. "Grade 5 Mathematics") ──
export async function getChildGrade(studentId) {
  const { data: enrollment, error: enrollError } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .limit(1)
    .maybeSingle()

  if (enrollError) throw new Error(enrollError.message)
  if (!enrollment) return null

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('name')
    .eq('id', enrollment.class_id)
    .maybeSingle()

  if (classError) throw new Error(classError.message)
  if (!cls?.name) return null

  // Extract "Grade 5" from "Grade 5 Mathematics"
  const match = cls.name.match(/Grade\s*\d+/i)
  return match ? match[0] : cls.name
}

// ── 4. Total focus/study time today for a child => call getTotalStudyTime(student ID)


//Link a child to this parent by email 
export async function linkChildByEmail(parentId, email) {
  const { data: student, error: findError } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, email, avatar_url')
    .eq('email', email)
    .maybeSingle()

  if (findError) throw new Error(findError.message)
  if (!student) throw new Error('No student account found with that email.')

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ parent_id: parentId })
    .eq('id', student.id)

  if (updateError) throw new Error(updateError.message)
  return student
}

// ── 7. Recently completed tasks for a child ─────────────────────────────────
export async function getRecentCompletedTasks(studentId, limit = 3) {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, taskName, subject, completeTask')
    .eq('student_id', studentId)
    .eq('completeTask', true)
    .limit(limit)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function isTaskComplete(taskId,userID) {
  const { data, error } = await supabase
    .from('tasks')
    .select('completeTask')
    .eq('userID', userID)
    .eq('id', taskId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data?.completeTask ?? false
}

export function getParentTip() {
  return "Consistent short study sessions tend to be more effective than long cramming sessions. Encourage regular breaks every 25–30 minutes."
}