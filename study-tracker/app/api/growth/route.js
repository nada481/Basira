import { getTotalStudyTime, getTimerHistory } from '@/services/timerService'
import { getTasksByStudent } from '@/services/taskService'
import { getMonthlyStats } from '@/services/reportService'

// GET /api/growth
export async function GET(req) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()

    const [totalSeconds, timerHistory, tasks, monthlyStats] = await Promise.all([
      getTotalStudyTime(studentId),
      getTimerHistory(studentId),
      getTasksByStudent(studentId),
      getMonthlyStats(studentId, now.getFullYear(), now.getMonth() + 1),
    ])

    return Response.json({ totalSeconds, timerHistory, tasks, monthlyStats })

  } catch (error) {
    console.error('Growth fetch error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}