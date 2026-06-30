import { createClient } from '@supabase/supabase-js'
 
// Public client — safe for client components, respects RLS.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)
 
// Admin client — server-only, bypasses RLS via the service role key.

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
 