import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { uploadDocumentFile } from '@/lib/storage'

export async function POST(req) {
  try {
    const teacherId = req.headers.get('x-user-id')
    if (!teacherId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const classId = formData.get('classId')

    if (!file || !classId) {
      return Response.json({ error: 'file and classId are required' }, { status: 400 })
    }

    const { data: cls, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', classId)
      .eq('teacher_id', teacherId)
      .maybeSingle()

    if (classError) throw new Error(classError.message)
    if (!cls) {
      return Response.json({ error: 'Class not found or unauthorized' }, { status: 404 })
    }

    const ext = file.name.split('.').pop()
    const path = `teacher/${teacherId}/${classId}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const fileUrl = await uploadDocumentFile(supabase, {
      path,
      buffer,
      contentType: file.type || 'application/octet-stream',
    })

    return Response.json({ fileUrl })
  } catch (error) {
    console.error('Teacher upload error:', error)
    return Response.json(
      { error: error.message ?? 'Upload failed' },
      { status: 500 }
    )
  }
}
