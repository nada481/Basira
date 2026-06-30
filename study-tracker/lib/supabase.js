import { createClient } from '@supabase/supabase-js'
 
// Public client — safe for client components, respects RLS.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)
 
