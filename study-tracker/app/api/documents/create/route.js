import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function POST(req) {
  try {
    const studentId           = req.headers.get('x-user-id')
    const { sessionId, fileUrl } = await req.json()

    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (!fileUrl)   return Response.json({ error: 'fileUrl is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('documents')
      .insert({
        userID:      studentId,
        session_id:  sessionId ?? null,
        file_url:    fileUrl,
        ai_verified: false,
        ai_feedback: null,
      })
      .select('id')
      .single()

    if (error) throw new Error(error.message)

    return Response.json({ documentId: data.id })

  } catch (error) {
    console.error('Create document error:', error)
    return Response.json(
      { error: 'Failed to create document', details: error.message },
      { status: 500 }
    )
  }
}