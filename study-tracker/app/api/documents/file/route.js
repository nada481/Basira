import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'
import { parseStoragePublicUrl } from '@/lib/storage'

export async function GET(req) {
  try {
    const fileUrl = req.nextUrl.searchParams.get('url')
    if (!fileUrl) {
      return Response.json({ error: 'url is required' }, { status: 400 })
    }

    const parsed = parseStoragePublicUrl(fileUrl)
    if (!parsed) {
      return Response.json({ error: 'Invalid storage URL' }, { status: 400 })
    }

    const { data: blob, error } = await supabase.storage.from(parsed.bucket).download(parsed.path)
    if (error) {
      console.error('[documents/file]', parsed.bucket, parsed.path, error.message)
      const status = /bucket not found/i.test(error.message) ? 404 : 500
      return Response.json(
        {
          error:
            status === 404
              ? `Storage bucket "${parsed.bucket}" was not found. Create it in Supabase Storage or re-upload the file.`
              : error.message,
        },
        { status }
      )
    }

    const filename = parsed.path.split('/').pop() || 'document'
    return new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[documents/file]', error)
    return Response.json({ error: error.message ?? 'Failed to open document' }, { status: 500 })
  }
}
