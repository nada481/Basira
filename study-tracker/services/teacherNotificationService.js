import { supabaseAdmin as supabase } from '@/lib/supabase'


export async function notifyTeacher({ studentId, documentId, note }) {
  const { data, error } = await supabase
    .from('teacher_notifications')
    .insert({
      student_id:  studentId,
      document_id: documentId,
      note,
      read:        false,
      created_at:  new Date().toISOString(),
    })
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function getUnreadNotifications(teacherId) {
  const { data, error } = await supabase
    .from('teacher_notifications')
    .select('*, documents(file_url, ai_feedback), students:student_id(display_name)')
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}