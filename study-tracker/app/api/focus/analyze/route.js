import { analyzeFocusFrame } from '@/services/focusService'
import { db } from '@/lib/supabase' 

export async function POST(req) {
  try {
    const body = await req.json()
    const { frame } = body

    if (!frame) {
      return Response.json(
        { error: 'No frame provided' },
        { status: 400 }
      )
    }

    const result = await analyzeFocusFrame(frame)

    const userId = req.headers.get('x-user-id') || 'anonymous'

    await db.insert('focus_events', {
      userId,
      focused: result.focused,
      reason: result.reason,
      timestamp: new Date(),
    })

    return Response.json(result)

  } catch (error) {
    console.error('Focus analyze error:', error)

    return Response.json(
      {
        error: 'Analysis failed',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    )
  }
}