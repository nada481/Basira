import supabase from '@/lib/supabase'

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, display_name, email, avatar_url, role_id')
    .eq('id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getStudentName(userId) {
  const profile = await getProfile(userId)
  return profile.display_name ?? profile.full_name ?? profile.email ?? 'Student'
}
export async function getTeacherName(userId) {
  const profile = await getProfile(userId)
  return profile.display_name ?? profile.full_name ?? profile.email ?? 'Teacher'
}
export async function getParentName(userId) {
  const profile = await getProfile(userId)
  return profile.display_name ?? profile.full_name ?? profile.email ?? 'Parent'
}

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

export async function updateDisplayName(userId, displayName) {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

export async function getAllStudents(){
    const { data, error } = await supabase.from('profiles')
}