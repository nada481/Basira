import { supabase } from '@/lib/supabase'
 
export async function upsertPageTracking({ id, userId, session_id,  documentId, pageNumber, timeSpentSeconds }) {
  const { error } = await supabase
    .from('page_tracking')
    .upsert(
      {
        id: id,
        userID:             userId,
        session_id:         session_id,
        document_id:        documentId,
        page_number:        pageNumber,
        time_spent_seconds: timeSpentSeconds,
      },
      { onConflict: 'userID, document_id, page_number' }
    )
 
  if (error) throw new Error(error.message)
}
 
//Mark a page as stuck + save AI diagnosis
export async function markPageStuck({ id, userId, session_id, documentId, pageNumber, aiDiagnosis, aiMaterialSuggestion }) {
  const { error } = await supabase
    .from('page_tracking')
    .update({
      got_stuck:              true,
      ai_diagnosis:           aiDiagnosis,
      ai_material_suggestion: aiMaterialSuggestion,
      notified_at:            new Date().toISOString(),
    })
    .eq('id', id).eq
('userID', userId).eq('session_id', session_id).eq('document_id', documentId)
    .eq('page_number', pageNumber)
 
  if (error) throw new Error(error.message)
}
 
export async function getStuckPages({ userId, session_id, documentId }) {
  const { data, error } = await supabase
    .from('page_tracking')
    .select('*')
    .eq('userID', userId)
    .eq('session_id', session_id)
    .eq('document_id', documentId)
    .eq('got_stuck', true)
    .order('page_number', { ascending: true })
 
  if (error) throw new Error(error.message)
  return data
}
 

export async function getPageProgress({ userId, session_id, documentId }) {
  const { data, error } = await supabase
    .from('page_tracking')
    .select('page_number, time_spent_seconds, got_stuck, ai_diagnosis')
    .eq('userID', userId)
    .eq('session_id', session_id)
    .eq('document_id', documentId)
    .order('page_number', { ascending: true })
 
  if (error) throw new Error(error.message)
  return data
}