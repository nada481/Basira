import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

const BUCKET_NAME = 'documents'

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

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, { contentType: file.type })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
    return Response.json({ fileUrl: urlData.publicUrl })
  } catch (error) {
    console.error('Teacher upload error:', error)
    return Response.json(
      { error: error.message ?? 'Upload failed' },
      { status: 500 }
    )
  }
}
