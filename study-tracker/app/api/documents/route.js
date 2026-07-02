import {
  getStudentDocuments,
  getDocumentsThisWeek,
  getDocumentsThisMonth,
  getDocument,
  getReportStats,
} from '@/services/documentService'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabaseAdmin as supabase } from '@/lib/supabase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function urlToBase64(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`)
  const buffer = await res.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

function getMimeType(url) {
  if (url.includes('.png'))  return 'image/png'
  if (url.includes('.webp')) return 'image/webp'
  return 'image/jpeg'
}

// ── Your original GET — unchanged ─────────────────────────────────────────────
export async function GET(req) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter     = searchParams.get('filter') ?? 'all'
    const documentId = searchParams.get('id')

    if (documentId) {
      const doc = await getDocument(documentId)
      return Response.json({ document: doc })
    }

    const [documents, stats] = await Promise.all([
      filter === 'week'    ? getDocumentsThisWeek(studentId)
      : filter === 'month' ? getDocumentsThisMonth(studentId)
      : getStudentDocuments(studentId),
      getReportStats(studentId),
    ])

    return Response.json({ documents, stats })

  } catch (error) {
    console.error('Documents fetch error:', error)
    return Response.json(
      { error: 'Failed to load documents', details: error.message },
      { status: 500 }
    )
  }
}

// gemini part here: 
export async function POST(req) {
  try {
    const { documentId } = await req.json()
    if (!documentId) {
      return Response.json({ error: 'documentId is required' }, { status: 400 })
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, file_url, session_id')
      .eq('id', documentId)
      .single()

    if (docError || !doc) {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }

    let taskContext = ''
    if (doc.session_id) {
      const { data: timer } = await supabase
        .from('timer')
        .select('task_id, tasks(taskName, subject, note)')
        .eq('id', doc.session_id)
        .maybeSingle()

      if (timer?.tasks) {
        const t = timer.tasks
        taskContext = `Task: "${t.taskName}" (${t.subject ?? 'General'}).${t.note ? ` Teacher note: "${t.note}"` : ''}`
      }
    }

    const base64Image = await urlToBase64(doc.file_url)
    const mimeType    = getMimeType(doc.file_url)

    const model  = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Image } },
      `You are an academic document reviewer for a student learning platform.
${taskContext ? `Context: ${taskContext}` : ''}
Review this student's submitted document and provide feedback.
Respond ONLY with a JSON object, no markdown:
{
  "verified": true or false,
  "feedback": "2-3 sentence constructive feedback"
}
verified is true if the document contains genuine student work. false if blank or unrelated.`,
    ])

    const clean  = result.response.text().replace(/\`\`\`json|\`\`\`/g, '').trim()
    const review = JSON.parse(clean)

    await supabase
      .from('documents')
      .update({ ai_verified: review.verified, ai_feedback: review.feedback })
      .eq('id', documentId)

    return Response.json({ verified: review.verified, feedback: review.feedback })

  } catch (error) {
    console.error('Document review error:', error)
    return Response.json(
      { error: 'Failed to review document', details: error.message },
      { status: 500 }
    )
  }
}