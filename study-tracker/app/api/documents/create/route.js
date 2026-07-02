import { createDocument } from '@/services/documentService'

// documents/create/route
export async function POST(req) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, fileUrl } = await req.json()
    if (!fileUrl) return Response.json({ error: 'fileUrl is required' }, { status: 400 })

    const doc = await createDocument(studentId, sessionId ?? null, fileUrl)

    return Response.json({ documentId: doc.id })

  } catch (error) {
    console.error('Create document error:', error)
    return Response.json(
      { error: 'Failed to create document', details: error.message },
      { status: 500 }
    )
  }
}