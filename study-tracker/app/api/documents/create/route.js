import { createDocument as createDocumentRecord, saveSessionPerformance } from '@/services/documentService'
import { getSessionPerformance } from '@/services/focusService'

export async function POST(req) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { sessionId, fileUrl } = await req.json()
    if (!fileUrl) return Response.json({ error: 'fileUrl is required' }, { status: 400 })

    const doc = await createDocumentRecord(studentId, sessionId ?? null, fileUrl)

    if (sessionId) {
      const sessionPerformance = await getSessionPerformance(sessionId)
      if (sessionPerformance) {
        await saveSessionPerformance(doc.id, sessionPerformance)
      }
    }

<<<<<<< Updated upstream
    const documentReviews = (docs ?? []).map(d =>
      `${d.ai_verified ? '✓' : '⚠'} ${d.ai_feedback}`
    ).join(' | ') || 'No documents submitted today.'

    const completedTasks = tasks
      .filter(t => t.completeTask)
      .map(t => t.taskName).join(', ') || 'none'

    const sessionList = timerHistory
      .slice(0, 5)
      .map(s => `${s.tasks?.taskName ?? 'Unknown'} (${formatMins(s.total_seconds ?? 0)})`)
      .join(', ') || 'none'

    const distractionDetails = Object.entries(distractionBreakdown)
      .map(([reason, secs]) => {
        const label = {
          phone_detected:  'phone detected',
          no_body:         'away from desk',
          not_writing:     'not facing the device or book',
          talking:         'talking',
          off_task_screen: 'off-task screen activity',
        }[reason] ?? reason
        return `${label} for ${formatMins(secs)}`
      }).join(', ') || 'none'

    const stuckDetails = stuckPages
      .map(p => `question ${p.page_number} — ${p.ai_diagnosis ?? 'struggled with content'}`)
      .join('; ') || 'none'

    const teacherNotified = stuckPages.length > 0 ? 'yes' : 'no'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'Authorization':   `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{
          role:    'user',
          content: `Write a short warm professional end-of-day progress note for a parent about their child.
Write in third person, 4-5 sentences, plain paragraph, no bullet points, no markdown.
Include both the study session summary AND the document review findings.
If any document was flagged as incorrect or incomplete, mention specifically which part of the work needs improvement.

Student: ${studentName}
Total focus time: ${formatMins(totalStudyTime)}
Sessions today: ${sessionList}
Tasks completed: ${completedTasks}
Total distracted: ${formatMins(totalDistracted)}
Distraction reasons: ${distractionDetails}
Stuck pages: ${stuckDetails}
Teacher notified: ${teacherNotified}
Document reviews: ${documentReviews}`,
        }],
      }),
    })

    const aiData    = await response.json()
    const narrative = aiData.content[0].text.trim()
    const report    = await saveReport({ studentId, narrative })

    return Response.json({ report })
=======
    return Response.json({ documentId: doc.id })
>>>>>>> Stashed changes

  } catch (error) {
    console.error('Create document error:', error)
    return Response.json(
      { error: 'Failed to create document', details: error.message },
      { status: 500 }
    )
  }
}
