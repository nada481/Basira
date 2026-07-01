import {
  startTimer,
  stopTimer,
  getActiveTimer,
  getTimerHistory,
  getTotalStudyTime,
  getTotalStudyTimeForTask,
  getFinishedTasksTime,
} from '@/services/timerService'

// GET /api/timer?type=total|history|active|task&taskId=xxx
export async function GET(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type   = searchParams.get('type')
    const taskId = searchParams.get('taskId')

    if (type === 'total') {
      const totalSeconds = await getTotalStudyTime(userId)
      return Response.json({ totalSeconds })
    }

    if (type === 'history') {
      const history = await getTimerHistory(userId)
      return Response.json({ history })
    }

    if (type === 'active') {
      const timer = await getActiveTimer(userId)
      return Response.json({ timer })
    }

    if (type === 'task' && taskId) {
      const [totalSeconds, finishTimes] = await Promise.all([
        getTotalStudyTimeForTask(userId, taskId),
        getFinishedTasksTime(userId, taskId),
      ])
      return Response.json({ totalSeconds, finishTimes })
    }

    return Response.json({ error: 'Invalid type param' }, { status: 400 })

  } catch (error) {
    console.error('Timer GET error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/timer?action=start|stop
export async function POST(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const body   = await req.json()

    if (action === 'start') {
      const timer = await startTimer({ userId, taskId: body.taskId })
      return Response.json({ timer })
    }

    if (action === 'stop') {
      await stopTimer({ timerId: body.timerId, totalSeconds: body.totalSeconds })
      return Response.json({ message: 'Timer stopped' })
    }

    return Response.json({ error: 'Invalid action param' }, { status: 400 })

  } catch (error) {
    console.error('Timer POST error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}