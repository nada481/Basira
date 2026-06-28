import { collectReportData, saveReport } from '@/services/reportService'
import { getStudentName } from '@/services/profileService'

function formatMins(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m} mins`
}

export async function POST(req) {
  try {
    const { studentId, sessionId } = await req.json()

    // Get student name and all data from the existing services
    const [studentName, data] = await Promise.all([
      getStudentName(studentId),
      collectReportData(studentId, sessionId),
    ])

    const {
      tasks,
      timerHistory,
      totalStudyTime,
      totalDistracted,
      distractionBreakdown,
      stuckPages,
    } = data

    // Build context to read
    const completedTasks = tasks
      .filter(t => t.status === 'complete')
      .map(t => t.title).join(', ') || 'none'

    const sessionList = timerHistory
      .slice(0, 5)
      .map(s => `${s.tasks?.title ?? 'Unknown'} (${formatMins(s.total_seconds ?? 0)})`)
      .join(', ') || 'none'

    const distractionDetails = Object.entries(distractionBreakdown)
      .map(([reason, secs]) => {
        const label = {
          phone_detected:  'phone detected',
          not_writing:     'not facing the device or book',
          talking:         'talking',
          off_task_screen: 'off-task screen activity',
        }[reason] ?? reason
        return `${label} for ${formatMins(secs)}`
      }).join(', ') || 'none'

    const stuckDetails = stuckPages
      .map(p => `page ${p.page_number} — ${p.ai_diagnosis ?? 'struggled with content'}`)
      .join('; ') || 'none'

    const teacherNotified = stuckPages.length > 0 ? 'yes' : 'no'

    // Ask AI to write the narrative
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Write a short warm professional end-of-day progress note for a student.
Write in third person, 3-4 sentences, plain paragraph, no bullet points, no markdown.

Student: ${studentName}
Total focus time: ${formatMins(totalStudyTime)}
Sessions today: ${sessionList}
Tasks completed: ${completedTasks}
Total distracted: ${formatMins(totalDistracted)}
Distraction reasons: ${distractionDetails}
Stuck pages: ${stuckDetails}
Teacher notified: ${teacherNotified}`,
        }],
      }),
    })

    const aiData    = await response.json()
    const narrative = aiData.content[0].text.trim()

    // 4. Save via reportService
    const report = await saveReport({ studentId, narrative })

    return Response.json({ report })

  } catch (error) {
    console.error('Report generation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}