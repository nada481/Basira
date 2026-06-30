import { getStudentParent, getStudentTeachers, addParentToStudent } from '@/services/profileService'

export async function GET(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [parent, teachers] = await Promise.all([
      getStudentParent(userId),
      getStudentTeachers(userId),
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

export async function POST(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { parentId } = await req.json()
    if (!parentId) {
      return Response.json({ error: 'parentId is required' }, { status: 400 })
    }

    await addParentToStudent(userId, parentId)
    return Response.json({ message: 'Parent added successfully' })

  } catch (error) {
    console.error('Add parent error:', error)
    return Response.json(
      { error: 'Failed to add parent', details: error.message },
      { status: 500 }
    )
  }
}