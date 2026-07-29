import { collectReportData, saveReport } from '@/services/reportService'
import { getStudentName }               from '@/services/profileService'
import { getSessionPerformance }        from '@/services/focusService'
import { formatDuration, formatDistractionBreakdown } from '@/lib/sessionPerformance'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function POST(req) {
  try {
    const { studentId, sessionId } = await req.json()

    const [studentName, data, sessionPerformance] = await Promise.all([
      getStudentName(studentId),
      collectReportData(studentId, sessionId),
      sessionId ? getSessionPerformance(sessionId) : Promise.resolve(null),
    ])

    const {
      tasks,
      timerHistory,
      totalStudyTime,
      totalDistracted,
      distractionBreakdown,
      stuckPages,
    } = data

    const today     = new Date().toISOString().split('T')[0]
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
      .map(s => `${s.tasks?.taskName ?? 'Unknown'} (${formatDuration(s.total_seconds ?? 0)})`)
      .join(', ') || 'none'

    const breakdown = sessionPerformance?.distractionBreakdown ?? distractionBreakdown
    const distractedSeconds = sessionPerformance?.totalDistractedSeconds ?? totalDistracted
    const studySeconds = sessionPerformance?.studySeconds ?? totalStudyTime
    const focusScore = sessionPerformance?.focusScore ?? 100

    const distractionDetails = formatDistractionBreakdown(breakdown)

    const stuckDetails = stuckPages
      .map(p => `question ${p.page_number} — ${p.ai_diagnosis ?? 'struggled with content'}`)
      .join('; ') || 'none'

    const teacherNotified = stuckPages.length > 0 ? 'yes' : 'no'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Write a short warm professional end-of-day progress note for a parent about their child.
Write in third person, 5-6 sentences, plain paragraph, no bullet points, no markdown.
You MUST include a dedicated focus-session performance summary: total study time, focus score, whether distractions occurred, and name each distraction type in plain language (for example: not looking at the camera, away from desk, phone detected, not reading or writing, talking, off-task screen).
If there were no distractions, say the student stayed focused.
Also include document review findings.
If any document was flagged as incorrect or incomplete, mention specifically which part of the work needs improvement.

Student: ${studentName}
Study session time: ${formatDuration(studySeconds)}
Focus score: ${focusScore}%
Total distracted time: ${formatDuration(distractedSeconds)}
Distraction breakdown: ${distractionDetails}
Sessions today: ${sessionList}
Tasks completed: ${completedTasks}
Stuck pages: ${stuckDetails}
Teacher notified: ${teacherNotified}
Document reviews: ${documentReviews}`,
        }],
      }),
    })

    const aiData    = await response.json()
    const narrative = aiData.content?.[0]?.text?.trim() ?? sessionPerformance?.narrative ?? 'Report unavailable.'

    const report = await saveReport({ studentId, narrative })

    return Response.json({ report, sessionPerformance })

  } catch (error) {
    console.error('Report generation error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
