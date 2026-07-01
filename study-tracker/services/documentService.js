import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

// Get all documents for a student with task info + focus time
export async function getStudentDocuments(studentId) {
  
  const { data: docs, error: docError } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, created_at')
    .eq('userID', studentId)
    .order('created_at', { ascending: false })

  if (docError) throw new Error(docError.message)
  if (!docs?.length) return []

  
  const enriched = await Promise.all(
    docs.map(async (doc) => {
      if (!doc.session_id) return { ...doc, task: null, focusSeconds: 0 }

      // Get the timer row (has task_id + total_seconds)
      const { data: timer, error: timerError } = await supabase
        .from('timer')
        .select('task_id, total_seconds')
        .eq('id', doc.session_id)
        .maybeSingle()

      if (timerError || !timer) return { ...doc, task: null, focusSeconds: 0 }

     
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id, taskName, subject, completeTask')
        .eq('id', timer.task_id)
        .maybeSingle()

      if (taskError) return { ...doc, task: null, focusSeconds: 0 }

      return {
        ...doc,
        task,
        focusSeconds: timer.total_seconds ?? 0,
      }
    })
  )

  return enriched
}

// Get a single document by ID
export async function getDocument(documentId) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, created_at')
    .eq('id', documentId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

// Get documents filtered by week (last 7 days)
export async function getDocumentsThisWeek(studentId) {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data, error } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, created_at')
    .eq('userID', studentId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Get documents filtered by month (last 30 days)
export async function getDocumentsThisMonth(studentId) {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data, error } = await supabase
    .from('documents')
    .select('id, session_id, file_url, ai_verified, ai_feedback, created_at')
    .eq('userID', studentId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
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

// create a document record for a student
export async function createDocument(studentId, sessionId, fileUrl) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      userID: studentId,
      session_id: sessionId,
      file_url: fileUrl,
      ai_verified: false,
      ai_feedback: null,
    })
    .select()
    .maybeSingle() 
  } 