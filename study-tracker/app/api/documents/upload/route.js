import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { uploadDocumentFile } from '@/lib/storage'

export async function POST(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    if (!file) {
      return Response.json({ error: 'file is required' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const fileUrl = await uploadDocumentFile(supabase, {
      path,
      buffer,
      contentType: file.type || 'application/octet-stream',
    })

    return Response.json({ fileUrl })
  } catch (error) {
    console.error('[documents/upload]', error)
    return Response.json({ error: error.message ?? 'Upload failed' }, { status: 500 })
  }
}
