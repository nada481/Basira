import { createDocument as createDocumentRecord, saveSessionPerformance } from '@/services/documentService'
import { getSessionPerformance } from '@/services/focusService'
import { completeTask } from '@/services/taskService'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

async function resolveSessionId(sessionId) {
  if (!sessionId) return null

  const { data, error } = await supabase
    .from('timer')
    .select('id, task_id')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ?? null
}

export async function POST(req) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, fileUrl, taskId } = await req.json()
    if (!fileUrl) return Response.json({ error: 'fileUrl is required' }, { status: 400 })

    const session = await resolveSessionId(sessionId)
    const resolvedSessionId = session?.id ?? null
    const resolvedTaskId = taskId ?? session?.task_id ?? null

    const doc = await createDocumentRecord(studentId, resolvedSessionId, fileUrl)

    if (!doc) {
      return Response.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    if (resolvedSessionId) {
      const sessionPerformance = await getSessionPerformance(resolvedSessionId)
      if (sessionPerformance) {
        await saveSessionPerformance(doc.id, sessionPerformance)
      }
    }

    let task = null
    if (resolvedTaskId) {
      task = await completeTask(resolvedTaskId, studentId)
    }

    return Response.json({ documentId: doc.id, task })

  } catch (error) {
    console.error('Create document error:', error)
    return Response.json(
      { error: 'Failed to create document', details: error.message },
      { status: 500 }
    )
  }
}
