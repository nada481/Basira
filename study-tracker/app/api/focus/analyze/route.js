import { logFocusEvent } from '@/services/focusService'

const FOCUS_PROMPT = `Analyze this student's study session from their webcam and optionally their shared screen.

Respond ONLY with a JSON object, no markdown, no code fences, no extra commentary:
{
  "focused": true or false,
  "reason": null or one of "phone_detected" | "not_writing" | "talking" | "off_task_screen",
  "currentQuestion": null or the question/problem number visible on the shared screen (e.g. "1", "2", "3a")
}

Rules:
- phone_detected if a phone or mobile device is visible in the webcam
- talking if mouth appears open or student is turned away from work
- not_writing if student does not appear to be reading or writing
- off_task_screen if the shared screen shows non-study content (games, social media, videos)
- currentQuestion: read the question number from homework/worksheet on the shared screen; null if no screen image or number is unclear`

async function analyzeWithGemini(parts) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          maxOutputTokens: 300,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const errBody = await response.text()
    console.error('Gemini focus error:', response.status, errBody)
    throw new Error(`Focus analysis failed (${response.status})`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No text returned from focus analysis')

  // Strip code fences, then extract the outermost {...} in case Gemini
  // still prefixes/suffixes commentary despite responseMimeType: json
  const withoutFences = text.replace(/```json|```/g, '').trim()
  const start = withoutFences.indexOf('{')
  const end   = withoutFences.lastIndexOf('}')
  const clean = start !== -1 && end !== -1 ? withoutFences.slice(start, end + 1) : withoutFences

  try {
    return JSON.parse(clean)
  } catch {
    console.error('Failed to parse focus JSON output:', text)
    throw new Error('Focus analysis returned invalid JSON')
  }
}

export async function POST(req) {
  try {
    const { frame, screenFrame, sessionId } = await req.json()

    if (!frame && !screenFrame) {
      return Response.json({ error: 'No frame data provided' }, { status: 400 })
    }

    const parts = [{ text: FOCUS_PROMPT }]
    if (frame) parts.push({ inline_data: { mime_type: 'image/jpeg', data: frame } })
    if (screenFrame) parts.push({ inline_data: { mime_type: 'image/jpeg', data: screenFrame } })

    const result = await analyzeWithGemini(parts)

    if (!result.focused && sessionId) {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      await logFocusEvent({
        sessionId,
        userId,
        reason:              result.reason,
        distractionDuration: 0,
        totalDistracted:     0,
        screenNote:          null,
        screenFlagged:       result.reason === 'off_task_screen',
      })
    }

    return Response.json({
      focused:         !!result.focused,
      reason:          result.reason ?? null,
      currentQuestion: result.currentQuestion ?? null,
    })
  } catch (error) {
    console.error('Focus analyze error:', error)
    return Response.json(
      { error: 'Analysis failed', details: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}