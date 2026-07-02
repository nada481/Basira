import {
  getTeacherProfile,
  getTeacherClasses,
  getAllStudentsByTeacher,
  getStudentFocusScore,
  getStudentLastActive,
  getClassOverviewStats,
} from '@/services/teacherService'

// GET /api/teacher?type=dashboard|students|classes
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

      // Enrich each student with focus score + last active
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

    return Response.json({ error: 'Invalid type param' }, { status: 400 })

  } catch (error) {
    console.error('Teacher API error:', error)
    return Response.json(
      { error: 'Failed to load teacher data', details: error.message },
      { status: 500 }
    )
  }
}