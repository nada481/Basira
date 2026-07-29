import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { getSessionPerformance } from '@/services/focusService'

async function enrichDocument(doc) {
  if (!doc.session_id) {
    return { ...doc, task: null, focusSeconds: 0, sessionPerformance: null, sessionNarrative: null }
  }

  const [{ data: timer, error: timerError }, sessionPerformanceFromDb] = await Promise.all([
    supabase
      .from('timer')
      .select('task_id, total_seconds')
      .eq('id', doc.session_id)
      .maybeSingle(),
    Promise.resolve(doc.ai_details?.sessionPerformance ?? null),
  ])

  let sessionPerformance = sessionPerformanceFromDb
  if (!sessionPerformance) {
    try {
      sessionPerformance = await getSessionPerformance(doc.session_id)
    } catch {
      sessionPerformance = null
    }
  }

  if (timerError || !timer) {
    return {
      ...doc,
      task: null,
      focusSeconds: sessionPerformance?.studySeconds ?? 0,
      sessionPerformance,
      sessionNarrative: sessionPerformance?.narrative ?? null,
    }
  }

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, taskName, subject, completeTask')
    .eq('id', timer.task_id)
    .maybeSingle()

  if (taskError) {
    return {
      ...doc,
      task: null,
      focusSeconds: timer.total_seconds ?? sessionPerformance?.studySeconds ?? 0,
      sessionPerformance,
      sessionNarrative: sessionPerformance?.narrative ?? null,
    }
  }

  return {
    ...doc,
    task,
    focusSeconds: timer.total_seconds ?? sessionPerformance?.studySeconds ?? 0,
    sessionPerformance,
    sessionNarrative: sessionPerformance?.narrative ?? null,
  }
}

async function enrichDocuments(docs) {
  if (!docs?.length) return []
  return Promise.all(docs.map(enrichDocument))
}

// Get all documents for a student with task info + focus time
export async function getStudentDocuments(studentId) {
  const { data: docs, error: docError } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, ai_details, created_at')
    .eq('userID', studentId)
    .order('created_at', { ascending: false })

  if (docError) throw new Error(docError.message)
  return enrichDocuments(docs ?? [])
}

// Get a single document by ID
export async function getDocument(documentId) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, ai_details, created_at, userID')
    .eq('id', documentId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return enrichDocument(data)
}

// Get documents filtered by week (last 7 days)
export async function getDocumentsThisWeek(studentId) {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data, error } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, ai_details, created_at')
    .eq('userID', studentId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return enrichDocuments(data ?? [])
}

// Get documents filtered by month (last 30 days)
export async function getDocumentsThisMonth(studentId) {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data, error } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, ai_details, created_at')
    .eq('userID', studentId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return enrichDocuments(data ?? [])
}

// Summary stats for the bottom cards
export async function getReportStats(studentId) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: docs, error } = await supabase
    .from('documents')
    .select('ai_verified, ai_feedback, created_at, session_id')
    .eq('userID', studentId)

  if (error) throw new Error(error.message)

  const total        = docs.length
  const reviewed     = docs.filter(d => d.ai_verified).length
  const withFeedback = docs.filter(d => d.ai_feedback).length
  const newThisWeek  = docs.filter(d => new Date(d.created_at) >= weekAgo).length

  return { total, reviewed, withFeedback, newThisWeek }
}

// Create a document record for a student (called on upload, before review)
export async function createDocument(studentId, sessionId, fileUrl) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      userID: studentId,
      session_id: sessionId,
      file_url: fileUrl,
      ai_verified: false,
      ai_feedback: null,
      ai_details: null,
    })
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function saveSessionPerformance(documentId, sessionPerformance) {
  const { data: existing, error: fetchError } = await supabase
    .from('documents')
    .select('ai_details')
    .eq('id', documentId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)

  const mergedDetails = {
    ...(existing?.ai_details ?? {}),
    sessionPerformance,
  }

  const { data, error } = await supabase
    .from('documents')
    .update({ ai_details: mergedDetails })
    .eq('id', documentId)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

// Save the AI's review results onto a document
export async function saveDocumentReview(documentId, { verified, feedback, details }) {
  const { data: existing } = await supabase
    .from('documents')
    .select('ai_details')
    .eq('id', documentId)
    .maybeSingle()

  const mergedDetails = {
    ...(existing?.ai_details ?? {}),
    ...(details ?? {}),
  }

  const { data, error } = await supabase
    .from('documents')
    .update({
      ai_verified: verified,
      ai_feedback: feedback,
      ai_details: Object.keys(mergedDetails).length ? mergedDetails : null,
    })
    .eq('id', documentId)
    .select()
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}
