import { getStudentParent, getTeachers } from '@/services/profileService'

export async function GET(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [parent, teachers] = await Promise.all([
      getStudentParent(userId),
      getTeachers(),
    ])

    return Response.json({ parent, teachers })
  } catch (error) {
    console.error('Connections fetch error:', error)
    return Response.json(
      { error: 'Failed to load connections', details: error.message },
      { status: 500 }
    )
  }
}