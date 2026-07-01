'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileText, Image, File, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const STUDENT_ID  = 'cccccccc-0000-0000-0000-000000000001'
const BUCKET_NAME = 'documents'

const ACCEPTED_TYPES = {
  'image/jpeg':                          { label: 'JPG Image',   icon: Image },
  'image/png':                           { label: 'PNG Image',   icon: Image },
  'application/pdf':                     { label: 'PDF',         icon: FileText },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { label: 'Word Doc', icon: File },
}

export default function CompleteSessionModal({ open, onClose, onConfirm, sessionId }) {
  const [file, setFile]         = useState(null)
  const [step, setStep]         = useState('upload') // upload | reviewing | done
  const [error, setError]       = useState(null)
  const [feedback, setFeedback] = useState(null)
  const inputRef                = useRef(null)

  if (!open) return null

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!ACCEPTED_TYPES[f.type]) {
      setError('Please upload a JPG, PNG, PDF, or Word document.')
      return
    }
    setError(null)
    setFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (!f) return
    if (!ACCEPTED_TYPES[f.type]) {
      setError('Please upload a JPG, PNG, PDF, or Word document.')
      return
    }
    setError(null)
    setFile(f)
  }

  async function handleSubmit() {
    if (!file) return
    setStep('reviewing')
    setError(null)

    try {
      // 1. Upload file to Supabase Storage
      const ext      = file.name.split('.').pop()
      const path     = `${STUDENT_ID}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, { contentType: file.type })

      if (uploadError) throw new Error(uploadError.message)

      // 2. Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(path)

      const fileUrl = urlData.publicUrl

      // 3. Create document record in DB
      const createRes = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': STUDENT_ID },
        body: JSON.stringify({ sessionId, fileUrl }),
      })
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error ?? 'Failed to save document')

      const documentId = createData.documentId

      // 4. Trigger Gemini review
      const reviewRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })
      const reviewData = await reviewRes.json()
      if (!reviewRes.ok) throw new Error(reviewData.error ?? 'Review failed')

      // 5. Generate end-of-day report
      await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: STUDENT_ID, sessionId }),
      })

      setFeedback(reviewData.feedback)
      setStep('done')

    } catch (err) {
      console.error(err)
      setError(err.message)
      setStep('upload')
    }
  }

  function handleClose() {
    setFile(null)
    setStep('upload')
    setError(null)
    setFeedback(null)
    onClose()
  }

  function handleConfirm() {
    handleClose()
    onConfirm?.()
  }

  const FileIcon = file ? (ACCEPTED_TYPES[file.type]?.icon ?? File) : Upload

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Complete Session</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload your work — Basira AI will review it and send a note to your parent.
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step: upload */}
        {step === 'upload' && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
                file ? 'border-[#8B1A4A] bg-pink-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${file ? 'bg-[#8B1A4A]' : 'bg-gray-100'}`}>
                <FileIcon className={`w-6 h-6 ${file ? 'text-white' : 'text-gray-400'}`} />
              </div>
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-bold text-[#8B1A4A]">{file.name}</p>
                  <p className="text-xs text-gray-400">{ACCEPTED_TYPES[file.type]?.label} · {(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600">Drop your file here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF, or Word document</p>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.docx"
              onChange={handleFile}
              className="hidden"
            />

            {error && <p className="text-xs text-red-500 -mt-2">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 border border-gray-200 text-gray-500 text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file}
                className="flex-1 bg-[#8B1A4A] hover:bg-[#C4526A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
              >
                Submit & Complete
              </button>
            </div>
          </>
        )}

        {/* Step: reviewing */}
        {step === 'reviewing' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-[#8B1A4A] animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">Reviewing your work...</p>
              <p className="text-xs text-gray-400 mt-1">Basira AI is checking your submission and preparing a report for your parent.</p>
            </div>
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800">Session Complete!</p>
                <p className="text-xs text-gray-400 mt-1">Your work has been reviewed and a report has been sent to your parent.</p>
              </div>
            </div>

            {feedback && (
              <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
                <p className="text-xs font-bold text-[#8B1A4A] mb-1">✨ AI Feedback</p>
                <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
              </div>
            )}

            <button
              onClick={handleConfirm}
              className="w-full bg-[#8B1A4A] hover:bg-[#C4526A] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              Done
            </button>
          </>
        )}

      </div>
    </div>
  )
}