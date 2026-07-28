import { logFocusEvent } from '@/services/focusService'

export async function POST(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      sessionId,
      reason,
      distractionDuration,
      totalDistracted,
      screenNote,
      screenFlagged,
    } = await req.json()

    if (!sessionId || !reason) {
      return Response.json({ error: 'sessionId and reason are required' }, { status: 400 })
    }

    await logFocusEvent({
      sessionId,
      userId,
      reason,
      distractionDuration: distractionDuration ?? 0,
      totalDistracted:     totalDistracted ?? distractionDuration ?? 0,
      screenNote:          screenNote ?? null,
      screenFlagged:       screenFlagged ?? false,
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Focus events error:', error)
    return Response.json(
      { error: 'Failed to log focus event', details: error.message },
      { status: 500 }
    )
  }
}
