import {
  getTeacherProfile,
  getTeacherClasses,
  getAllStudentsByTeacher,
  getStudentFocusScore,
  getStudentLastActive,
  getClassOverviewStats,
  addStudentToClass,
  createTasksForClass,
} from '@/services/teacherService'
import { getTasksByStudent } from '@/services/taskService'

// GET /api/teacher?type=dashboard|students|classes|student-tasks
export async function GET(req) {
  try {
    const teacherId = req.headers.get('x-user-id')
    if (!teacherId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'dashboard'

    if (type === 'dashboard') {
      const [profile, stats, classes] = await Promise.all([
        getTeacherProfile(teacherId),
        getClassOverviewStats(teacherId),
        getTeacherClasses(teacherId),
      ])
      return Response.json({ profile, stats, classes })
    }

    if (type === 'students') {
      const students = await getAllStudentsByTeacher(teacherId)

      const enriched = await Promise.all(
        students.map(async (student) => {
          const [focusScore, activity] = await Promise.all([
            getStudentFocusScore(student.id),
            getStudentLastActive(student.id),
          ])
          return { ...student, focusScore, ...activity }
        })
      )

      return Response.json({ students: enriched })
    }

    if (type === 'classes') {
      const classes = await getTeacherClasses(teacherId)
      return Response.json({ classes })
    }

    if (type === 'student-tasks') {
      const studentId = searchParams.get('studentId')
      if (!studentId) {
        return Response.json({ error: 'studentId is required' }, { status: 400 })
      }

      const tasks = await getTasksByStudent(studentId)
      return Response.json({ tasks })
    }

    return Response.json({ error: 'Invalid type param' }, { status: 400 })
  } catch (error) {
    console.error('Teacher API error:', error)
    return Response.json(
      { error: 'Failed to load teacher data', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/teacher?action=add-student|create-task
export async function POST(req) {
  try {
    const teacherId = req.headers.get('x-user-id')
    if (!teacherId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const body = await req.json()

    if (action === 'add-student') {
      const { classId, email } = body
      if (!classId || !email) {
        return Response.json({ error: 'classId and email are required' }, { status: 400 })
      }

      const student = await addStudentToClass({ teacherId, classId, email })
      return Response.json({ student })
    }

    if (action === 'create-task') {
      const { classId, taskName, subject, description, estimatedMinutes, dueDate, fileUrl } = body
      if (!classId || !taskName) {
        return Response.json({ error: 'classId and taskName are required' }, { status: 400 })
      }

      const tasks = await createTasksForClass({
        teacherId,
        classId,
        taskName,
        subject,
        description,
        estimatedMinutes,
        dueDate,
        fileUrl,
      })
      return Response.json({ tasks })
    }

    return Response.json({ error: 'Invalid action param' }, { status: 400 })
  } catch (error) {
    console.error('Teacher API error:', error)
    return Response.json(
      { error: error.message ?? 'Failed to process request' },
      { status: 500 }
    )
  }
}
