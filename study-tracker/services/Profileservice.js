import { supabase } from '@/lib/supabase'

// Get a profile by user ID:
export async function getProfile(userId) {
  console.log("Looking for profile:", userId);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, email, avatar_url, role_id")
    .eq("id", userId)
    .maybeSingle();

  console.log({ data, error });
  console.log("Looking for profile:", userId);
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

//  Update display name 
export async function updateDisplayName(userId, displayName) {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

export async function getStudentParent(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      parent_id,
      parent:profiles!profiles_parent_id_fkey (
        id, full_name, display_name, email, avatar_url,
        roles ( name )
      )
    `)
    .eq('id', userId)
    .single()

  if (error) throw new Error(error.message)
  return data.parent ?? null
}

// Get all teachers — profiles whose role name is 'teacher'
export async function getTeachers() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, full_name, display_name, email, avatar_url,
      roles ( name )
    `)
    .eq('roles.name', 'teacher')

  if (error) throw new Error(error.message)
  return data ?? []
}