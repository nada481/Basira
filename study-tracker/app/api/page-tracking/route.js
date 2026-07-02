import { logQuestionTime } from '@/services/pageTrackingService'

export async function POST(request) {
  try {
    const {
      userId,
      sessionId,
      documentId,
      questionNumber,
      timeSpentSeconds,
      estimatedSeconds,
    } = await request.json()

    if (!userId || !sessionId || questionNumber == null || timeSpentSeconds == null) {
      return Response.json(
        { error: 'userId, sessionId, questionNumber, and timeSpentSeconds are required' },
        { status: 400 }
      )
    }

    const result = await logQuestionTime({
      userId,
      session_id:         sessionId,
      documentId:         documentId ?? sessionId,
      questionNumber,
      timeSpentSeconds,
      estimatedSeconds:   estimatedSeconds ?? 180,
    })

    return Response.json(result)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
