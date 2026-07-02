import { collectReportData, saveReport } from '@/services/reportService'
import { supabaseAdmin as supabase }     from '@/lib/supabase'

function formatMins(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m} mins`
}

async function getStudentName(studentId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, full_name, email')
    .eq('id', studentId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data?.display_name ?? data?.full_name ?? data?.email ?? 'Student'
}

export async function POST(req) {
  try {
    const { studentId, sessionId } = await req.json()

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

    const today = new Date().toISOString().split('T')[0]
    const { data: docs } = await supabase
      .from('documents')
      .select('ai_verified, ai_feedback, session_id')
      .eq('userID', studentId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .not('ai_feedback', 'is', null)

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

  } catch (error) {
    console.error('Report generation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}