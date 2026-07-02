import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

function parseQuestionNumber(questionNumber) {
  if (typeof questionNumber === 'number') return questionNumber
  const parsed = parseInt(String(questionNumber).replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function upsertPageTracking({ id, userId, session_id, documentId, pageNumber, timeSpentSeconds, gotStuck }) {
  const row = {
    userID:             userId,
    session_id,
    document_id:        documentId,
    page_number:        pageNumber,
    time_spent_seconds: timeSpentSeconds,
    ...(gotStuck != null && { got_stuck: gotStuck }),
  }
  if (id) row.id = id

  const { error } = await supabase
    .from('page_tracking')
    .upsert(row, { onConflict: 'userID, document_id, page_number' })

  if (error) throw new Error(error.message)
}

export async function logQuestionTime({
  userId,
  session_id,
  documentId,
  questionNumber,
  timeSpentSeconds,
  estimatedSeconds,
}) {
  const pageNumber = parseQuestionNumber(questionNumber)
  const docId = documentId ?? session_id
  const gotStuck = timeSpentSeconds >= estimatedSeconds

  const row = {
    userID:             userId,
    session_id,
    document_id:        docId,
    page_number:        pageNumber,
    time_spent_seconds: timeSpentSeconds,
    got_stuck:          gotStuck,
  }

  if (gotStuck) {
    row.ai_diagnosis = `Spent ${Math.round(timeSpentSeconds / 60)} min on question ${questionNumber} (estimated ${Math.round(estimatedSeconds / 60)} min)`
    row.notified_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('page_tracking')
    .upsert(row, { onConflict: 'userID, document_id, page_number' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function markPageStuck({ id, userId, session_id, documentId, pageNumber, aiDiagnosis, aiMaterialSuggestion }) {
  const { error } = await supabase
    .from('page_tracking')
    .update({
      got_stuck:              true,
      ai_diagnosis:           aiDiagnosis,
      ai_material_suggestion: aiMaterialSuggestion,
      notified_at:            new Date().toISOString(),
    })
    .eq('id', id)
    .eq('userID', userId)
    .eq('session_id', session_id)
    .eq('document_id', documentId)
    .eq('page_number', pageNumber)

  if (error) throw new Error(error.message)
}

export async function getStuckPages({ userId, session_id, documentId }) {
  let query = supabase
    .from('page_tracking')
    .select('*')
    .eq('userID', userId)
    .eq('got_stuck', true)

  if (session_id) query = query.eq('session_id', session_id)
  if (documentId) query = query.eq('document_id', documentId)

  const { data, error } = await query.order('page_number', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPageProgress({ userId, session_id, documentId }) {
  let query = supabase
    .from('page_tracking')
    .select('page_number, time_spent_seconds, got_stuck, ai_diagnosis')
    .eq('userID', userId)

  if (session_id) query = query.eq('session_id', session_id)
  if (documentId) query = query.eq('document_id', documentId)

  const { data, error } = await query.order('page_number', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
