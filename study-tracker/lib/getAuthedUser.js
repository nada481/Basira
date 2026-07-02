import { createSupabaseServerClient } from '@/lib/supabaseServer'

// Returns { id, roleId, role, display_name, full_name } for the current user, or null.
// role is the plain-text name from the roles table (e.g. "teacher", "student", "parent").
export async function getAuthedUser() {
  const supabase = await createSupabaseServerClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role_id, display_name, full_name, roles(name)')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return null

  return {
    id: profile.id,
    roleId: profile.role_id,
    role: profile.roles?.name ?? null,
    display_name: profile.display_name,
    full_name: profile.full_name,
  }
}