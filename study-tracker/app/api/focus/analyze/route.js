import { logFocusEvent } from '@/services/focusService'

export async function POST(req) {
  try {
    const { sessionId, detectedObjects, poseData } = await req.json()
    // detectedObjects = [{ label: 'cell phone', score: 0.91 }, ...]
    // poseData        = { mouthOpen: true, lookingAway: false, ... }

    if (!detectedObjects) {
      return Response.json({ error: 'No detection data provided' }, { status: 400 })
    }

    // Build a plain-text summary for Claude — no image needed
    const objectSummary = detectedObjects
      .map(o => `${o.label} (confidence: ${Math.round(o.score * 100)}%)`)
      .join(', ')

    const poseSummary = poseData
      ? Object.entries(poseData)
          .filter(([, v]) => v === true)
          .map(([k]) => k)
          .join(', ') || 'none'
      : 'unavailable'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `A student is being monitored for focus. Google Vision detected:
Objects: ${objectSummary}
Pose signals: ${poseSummary}

Respond ONLY with a JSON object, no markdown:
{"focused": true, "reason": null}
or
{"focused": false, "reason": "phone_detected" | "not_writing" | "talking"}

Rules:
- phone_detected if any phone/mobile device is visible
- talking if mouth appears open or face turned away
- not_writing if no pen/book/keyboard detected and student not engaged`
        }]
      })
    })

    const data = await response.json()
    const clean = data.content[0].text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    if (!result.focused) {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      await logFocusEvent({
        sessionId,
        userId,
        reason:              result.reason,
        distractionDuration: 0,   // client should track and send this
        totalDistracted:     0,
        screenNote:          null,
        screenFlagged:       false,
      })
    }

    return Response.json(result)

  } catch (error) {
    console.error('Focus analyze error:', error)
    return Response.json(
      { error: 'Analysis failed', details: error?.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}