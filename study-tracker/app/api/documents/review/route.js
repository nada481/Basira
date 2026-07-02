import { getDocument, saveDocumentReview } from '@/services/documentService'
import { notifyTeacher } from '@/services/teacherNotificationService'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import mammoth from 'mammoth'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// Extract { bucket, path } from a Supabase Storage public URL
function parseStorageUrl(fileUrl) {
  const match = fileUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  if (!match) throw new Error('Could not parse storage path from file_url')
  return { bucket: match[1], path: decodeURIComponent(match[2]) }
}

// Fetch the file and return either { kind: 'inline', base64, mimeType } for images/PDF
// or { kind: 'text', text } for docx (Gemini's inline_data doesn't accept Word docs)
async function fetchFileForReview(fileUrl) {
  const { bucket, path } = parseStorageUrl(fileUrl)

  const { data: blob, error } = await supabase.storage.from(bucket).download(path)
  if (error) throw new Error(`Could not fetch document file: ${error.message}`)

  const mimeType = blob.type || 'application/octet-stream'
  const buffer   = Buffer.from(await blob.arrayBuffer())

  if (mimeType === DOCX_MIME) {
    const { value: text } = await mammoth.extractRawText({ buffer })
    return { kind: 'text', text }
  }

  return { kind: 'inline', base64: buffer.toString('base64'), mimeType }
}

// POST /api/documents/review
// body: { documentId, taskName?, subject? }
export async function POST(req) {
  try {
    const { documentId, taskName, subject } = await req.json()
    if (!documentId) return Response.json({ error: 'documentId is required' }, { status: 400 })

    const doc = await getDocument(documentId)
    if (!doc) return Response.json({ error: 'Document not found' }, { status: 404 })
    if (!doc.file_url) return Response.json({ error: 'Document has no file_url' }, { status: 400 })

    const file = await fetchFileForReview(doc.file_url)

    const prompt = `You are reviewing a student's submitted homework document${subject ? ` for ${subject}` : ''}${taskName ? ` (assignment: "${taskName}")` : ''}.${file.kind === 'text' ? `

Here is the document text:
"""
${file.text}
"""` : ''}

Look at each question or problem in the document. For each one, determine if the student's answer is correct, incorrect, or incomplete, and briefly explain why in plain, encouraging language a parent can understand.

Respond ONLY with a JSON object, no markdown, no code fences. Keep each "feedback" field under 25 words so the full response stays concise:
{
  "verified": true or false (true only if ALL questions are correct and complete),
  "summary": "2-sentence overall summary for a parent",
  "questions": [
    { "number": "1", "status": "correct" | "incorrect" | "incomplete", "feedback": "short specific note on what's right or what needs work" }
  ],
  "areasToImprove": ["short phrase naming a specific topic/skill the student should practice, based on the incorrect/incomplete questions"]
}

If the document has no clearly numbered questions (e.g. it's an essay or single piece of writing), use "questions": [{ "number": "overall", "status": "...", "feedback": "..." }].`

    const parts = file.kind === 'inline'
      ? [{ text: prompt }, { inline_data: { mime_type: file.mimeType, data: file.base64 } }]
      : [{ text: prompt }]

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Gemini review error:', response.status, errBody)
      throw new Error(`AI review request failed (${response.status})`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error('Unexpected Gemini response shape:', JSON.stringify(data))
      throw new Error('No text returned from AI review')
    }

    const clean = text.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error('Failed to parse Gemini JSON output:', clean)
      throw new Error('AI review returned invalid JSON')
    }

    const details = { questions: parsed.questions ?? [], areasToImprove: parsed.areasToImprove ?? [] }

    const saved = await saveDocumentReview(documentId, {
      verified: !!parsed.verified,
      feedback: parsed.summary ?? 'Review complete.',
      details,
    })

    // Flag for teacher review if anything was wrong/incomplete
    if (!parsed.verified) {
      await notifyTeacher({
        studentId: doc.userID,
        documentId,
        note: `Needs review — ${details.areasToImprove.join(', ') || 'see AI feedback'}`,
      })
    }

    return Response.json({ document: saved })

  } catch (error) {
    console.error('Document review error:', error)
    return Response.json({ error: error.message ?? 'Failed to review document' }, { status: 500 })
  }
}