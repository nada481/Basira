import {
  getLinkedChildren,
  linkChildByEmail,
} from '@/services/parentService'
import { getTotalStudyTime } from '@/services/timerService'

// GET /api/parent/connections
export async function GET(req) {
  try {
    const parentId = req.headers.get('x-user-id')
    if (!parentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const children = await getLinkedChildren(parentId)

    const enriched = await Promise.all(
      children.map(async (child) => {
        const todaySeconds = await getTotalStudyTime(child.id)
        return { ...child, todaySeconds }
      })
    )

    return Response.json({ children: enriched })

  } catch (error) {
    console.error('Parent connections fetch error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/parent/connections — link child by email
export async function POST(req) {
  try {
    const parentId = req.headers.get('x-user-id')
    if (!parentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { email } = await req.json()
    if (!email) return Response.json({ error: 'email is required' }, { status: 400 })

    const student = await linkChildByEmail(parentId, email)
    return Response.json({ message: 'Student linked successfully', student })

  } catch (error) {
    console.error('Link child error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}