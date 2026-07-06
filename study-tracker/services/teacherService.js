import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function getTeacherProfile(teacherId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, avatar_url, role_id')
    .eq('id', teacherId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Teacher profile not found')
  return data
}

export async function getTeacherClasses(teacherId) {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', teacherId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Fix: get class_ids first, then query class_students
export async function getStudentsByClass(teacherId) {
  // 1. Get all classes this teacher owns
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', teacherId)

  if (classError) throw new Error(classError.message)
  if (!classes?.length) return {}

  // 2. For each class, get enrolled students
  const grouped = {}
  await Promise.all(
    classes.map(async (cls) => {
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_students')
        .select(`
          student_id,
          student:profiles!class_students_student_id_fkey (
            id, full_name, display_name, email, avatar_url
          )
        `)
        .eq('class_id', cls.id)

      if (enrollError) throw new Error(enrollError.message)

      grouped[cls.name] = {
        classId:  cls.id,
        students: (enrollments ?? []).map(e => e.student).filter(Boolean),
      }
    })
  )

  return grouped
}

// All students flat list (for the student management table)
export async function getAllStudentsByTeacher(teacherId) {
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', teacherId)

  if (classError) throw new Error(classError.message)
  if (!classes?.length) return []

  const classIds = classes.map(c => c.id)
  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]))

  const { data: enrollments, error: enrollError } = await supabase
    .from('class_students')
    .select(`
      class_id,
      student:profiles!class_students_student_id_fkey (
        id, full_name, display_name, email, avatar_url
      )
    `)
    .in('class_id', classIds)

  if (enrollError) throw new Error(enrollError.message)

  // Dedupe by student id (student may be in multiple classes)
  const seen = new Set()
  const students = []
  for (const row of enrollments ?? []) {
    if (!row.student || seen.has(row.student.id)) continue
    seen.add(row.student.id)
    students.push({ ...row.student, className: classMap[row.class_id] })
  }

  return students
}

export async function getStudentFocusScore(studentId) {
  const { data, error } = await supabase
    .from('focus_events')
    .select('distraction_duration')
    .eq('userID', studentId)
    .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (error) throw new Error(error.message)
  if (!data?.length) return 100

  const totalDistracted   = data.reduce((s, r) => s + (r.distraction_duration ?? 0), 0)
  const totalSessionTime  = 25 * 60 * data.length
  return Math.max(0, Math.round(100 - (totalDistracted / totalSessionTime) * 100))
}

export async function getStudentLastActive(studentId) {
  const { data, error } = await supabase
    .from('timer')
    .select('finish_time, start_time')
    .eq('userID', studentId)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return { lastActive: null, isOnline: false }
  return { lastActive: data.finish_time ?? null, isOnline: !data.finish_time }
}

export async function getClassOverviewStats(teacherId) {
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', teacherId)

  if (classError) throw new Error(classError.message)
  if (!classes?.length) return { totalStudents: 0, activeNow: 0, assignmentsDue: 0 }

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
    .eq('completeTask', false)

  return {
    totalStudents:  totalStudents  ?? 0,
    activeNow:      activeNow      ?? 0,
    assignmentsDue: assignmentsDue ?? 0,
  }
}

export async function getClassName(classId) {
  const { data, error } = await supabase
    .from('classes')
    .select('name')
    .eq('id', classId)
    .single()

  if (error) throw new Error(error.message)
  return data?.name ?? null
}

export async function verifyTeacherOwnsClass(teacherId, classId) {
  const { data, error } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Class not found or unauthorized')
  return data
}

export async function addStudentToClass({ teacherId, classId, email }) {
  await verifyTeacherOwnsClass(teacherId, classId)

  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, email, avatar_url')
    .eq('email', email.trim())
    .maybeSingle()

  if (studentError) throw new Error(studentError.message)
  if (!student) throw new Error('No student found with that email')

  const { error: enrollError } = await supabase
    .from('class_students')
    .insert({ class_id: classId, student_id: student.id })

  if (enrollError) throw new Error(enrollError.message)
  return student
}

export async function createTasksForClass({
  teacherId,
  classId,
  taskName,
  subject,
  description,
  estimatedMinutes,
  dueDate,
  fileUrl,
}) {
  await verifyTeacherOwnsClass(teacherId, classId)

  const { data: enrollments, error: enrollError } = await supabase
    .from('class_students')
    .select('student_id')
    .eq('class_id', classId)

  if (enrollError) throw new Error(enrollError.message)
  if (!enrollments?.length) throw new Error('No students enrolled in this class')

  const note = [description, fileUrl ? `Attachment: ${fileUrl}` : null]
    .filter(Boolean)
    .join('\n\n')

  const tasks = await Promise.all(
    enrollments.map(async ({ student_id }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          userID: student_id,
          taskName,
          subject: subject ?? null,
          note: note || null,
          class_id: classId,
          estimated_minutes: estimatedMinutes ?? null,
          due_date: dueDate ?? null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    })
  )

  return tasks
}