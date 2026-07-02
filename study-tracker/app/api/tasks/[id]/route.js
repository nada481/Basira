import { updateTask } from '@/services/taskService'

// PATCH /api/tasks/:id
export async function PATCH(req, { params }) {
  try {
    const studentId = req.headers.get('x-user-id')
    if (!studentId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const updates = await req.json()
    const task = await updateTask(params.id, updates)
    return Response.json({ task })

  } catch (error) {
    console.error('Task update error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}