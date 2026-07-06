import { getTasksByStudent, getTaskById, createTask } from '@/services/taskService'

// GET /api/tasks or GET /api/tasks?taskId=xxx
export async function GET(req) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    // Single task lookup — used by study session page
    if (taskId) {
      const task = await getTaskById(taskId)
      return Response.json({ task })
    }

    // All tasks for student
    const tasks = await getTasksByStudent(studentId)
    return Response.json({ tasks })

  } catch (error) {
    console.error('Tasks fetch error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(req) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { taskName, subject, type, note, classId, estimatedMinutes, dueDate } = await req.json()
    if (!taskName) return Response.json({ error: 'taskName is required' }, { status: 400 })

    const task = await createTask({
      userID: studentId, taskName, subject, type, note, classId, estimatedMinutes, dueDate,
    })

    return Response.json({ task })

  } catch (error) {
    console.error('Task create error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}