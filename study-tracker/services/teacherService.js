import { supabase } from '@/lib/supabase'

export async function getTeacherProfile(teacherId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, avatar_url, role_id')
    .eq('id', teacherId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getTeacherClasses(teacherId) {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', teacherId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getStudentsByTeacher(teacherId) {
  const { data, error } = await supabase
    .from('class_students')
    .select(`
      class_id,
      classes ( id, name ),
      profiles:student_id (
        id, full_name, display_name, email, avatar_url
      )
    `)
    .eq('classes.teacher_id', teacherId)

  if (error) throw new Error(error.message)

 
  const grouped = {}
  for (const row of data) {
    if (!row.classes) continue
    const className = row.classes.name
    if (!grouped[className]) grouped[className] = { classId: row.class_id, students: [] }
    grouped[className].students.push(row.profiles)
  }
  return grouped
}

export async function getStudentFocusScore(studentId) {
  const { data, error } = await supabase
    .from('focus_events')
    .select('distraction_duration, detected_at')
    .eq('user_id', studentId)
    .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) 

  if (error) throw new Error(error.message)
  if (!data.length) return 100

  const totalDistracted = data.reduce((s, r) => s + (r.distraction_duration ?? 0), 0)
  const totalSessionTime = 25 * 60 * data.length // assume 25min sessions
  const score = Math.max(0, Math.round(100 - (totalDistracted / totalSessionTime) * 100))
  return score
}

export async function getStudentLastActive(studentId) {
  const { data, error } = await supabase
    .from('timer')
    .select('finish_time, start_time')
    .eq('userID', studentId)
    .order('start_time', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)
  if (!data) return null

  // If finish_time is null, student is currently active
  return { lastActive: data.finish_time ?? null, isOnline: !data.finish_time }
}

export async function getClassOverviewStats(teacherId) {
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId)

  if (!classes?.length) return { avgFocusScore: 0, activeNow: 0, assignmentsDue: 0, totalStudents: 0 }

  const classIds = classes.map(c => c.id)

  const { count: totalStudents } = await supabase
    .from('class_students')
    .select('*', { count: 'exact', head: true })
    .in('class_id', classIds)

  const { count: activeNow } = await supabase
    .from('timer')
    .select('*', { count: 'exact', head: true })
    .is('finish_time', null)
    .gte('start_time', new Date(Date.now() - 60 * 60 * 1000).toISOString())

  const { count: assignmentsDue } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'complete')

  return {
    totalStudents: totalStudents ?? 0,
    activeNow:     activeNow     ?? 0,
    assignmentsDue: assignmentsDue ?? 0,
  }
}