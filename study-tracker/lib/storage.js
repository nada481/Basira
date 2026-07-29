export const DOCUMENTS_BUCKET = 'documents'

/** Parse a Supabase public storage URL into bucket + object path. */
export function parseStoragePublicUrl(fileUrl) {
  if (!fileUrl) return null

  const match = String(fileUrl).match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  if (!match) return null

  return {
    bucket: match[1],
    path: decodeURIComponent(match[2]),
  }
}

export function documentFileHref(fileUrl) {
  if (!fileUrl) return null
  return `/api/documents/file?url=${encodeURIComponent(fileUrl)}`
}

/** Create the documents bucket if it is missing (service role only). */
export async function ensureDocumentsBucket(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw new Error(listError.message)

  if (buckets?.some((bucket) => bucket.name === DOCUMENTS_BUCKET)) return

  const { error: createError } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024,
  })

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(createError.message)
  }
}

export async function uploadDocumentFile(supabase, { path, buffer, contentType }) {
  await ensureDocumentsBucket(supabase)

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, buffer, { contentType, upsert: false })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}
