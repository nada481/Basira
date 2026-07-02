import { supabaseAdmin as supabase } from '@/lib/supabase'

// Get a profile by user ID:
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email, avatar_url, role_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// Get display name (falls back: display_name → full_name → email)
export async function getStudentName(userId) {
  const profile = await getProfile(userId)
  return profile.display_name ?? profile.full_name ?? profile.email ?? 'Student'
}

// Get profile with role name
export async function getProfileWithRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, display_name, email, avatar_url,
      roles ( id, name )
    `)
    .eq('id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Update display name
export async function updateDisplayName(userId, displayName) {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

export async function getStudentParent(userId) {
  // 1. Get the parent_id from the student's profile
  const { data: student, error: studentError } = await supabase
    .from('profiles')
    .select('parent_id')
    .eq('id', userId)
    .maybeSingle()

  if (studentError) throw new Error(studentError.message)
  if (!student?.parent_id) return null

  // 2. Resolve the parent's profile
  const { data: parent, error: parentError } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, email, avatar_url')
    .eq('id', student.parent_id)
    .maybeSingle()

  if (parentError) throw new Error(parentError.message)
  return parent
}

export async function getStudentTeachers(studentId) {
  const { data: enrollments, error: enrollError } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)

  if (enrollError) throw new Error(enrollError.message)
  if (!enrollments?.length) return []

  const classIds = enrollments.map(e => e.class_id)

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select(`
      id, name, teacher_id,
      teacher:profiles!classes_teacher_id_fkey ( id, full_name, display_name, email, avatar_url )
    `)
    .in('id', classIds)

  if (classError) throw new Error(classError.message)

  const teachers = classes.map(c => c.teacher).filter(Boolean)

  // Dedupe — a teacher may teach multiple classes the student is enrolled in
  const uniqueTeachers = Array.from(
    new Map(teachers.map(t => [t.id, t])).values()
  )

  return uniqueTeachers
}

export async function addParentToStudent(studentId, parentId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ parent_id: parentId })
    .eq('id', studentId)
    .select()

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error(`No row matched id = ${studentId} — update affected 0 rows`)
  }
}

export async function getStudent(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}