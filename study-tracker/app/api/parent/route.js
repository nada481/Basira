import {
  getParentName,
  getLinkedChildren,
  getChildGrade,
  getRecentCompletedTasks,
  getParentTip,
} from '@/services/parentService'
import {getTotalStudyTime} from '@/services/timerService'

// GET /api/parent — full dashboard payload for the parent's family overview page
export async function GET(req) {
  try {
    const parentId = req.headers.get('x-user-id')
    if (!parentId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [parentName, children] = await Promise.all([
      getParentName(parentId),
      getLinkedChildren(parentId),
    ])

    // Enrich each child with grade, today's time, and recent completed tasks
    const enrichedChildren = await Promise.all(
      children.map(async (child) => {
        const [grade, totalStudyTime, recentTasks] = await Promise.all([
          getChildGrade(child.id),
          getTotalStudyTime(child.id),
          getRecentCompletedTasks(child.id, 3),
        ])
        return { ...child, grade, totalStudyTime, recentTasks }
      })
    )

    return Response.json({
      parentName,
      children: enrichedChildren,
      parentTip: getParentTip(),
    })

  } catch (error) {
    console.error('Parent dashboard fetch error:', error)
    return Response.json(
      { error: 'Failed to load parent dashboard', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/parent — link a new child by email
export async function POST(req) {
  try {
    const parentId = req.headers.get('x-user-id')
    if (!parentId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()
    if (!email) {
      return Response.json({ error: 'email is required' }, { status: 400 })
    }

    const { linkChildByEmail } = await import('@/services/parentService')
    const student = await linkChildByEmail(parentId, email)

    return Response.json({ message: 'Student linked successfully', student })

  } catch (error) {
    console.error('Link child error:', error)
    return Response.json(
      { error: 'Failed to link student', details: error.message },
      { status: 500 }
    )
  }
}