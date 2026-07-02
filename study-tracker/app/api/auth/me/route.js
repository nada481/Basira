import { getAuthedUser } from '@/lib/getAuthedUser'

export async function GET() {
  const user = await getAuthedUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json({ user })
}