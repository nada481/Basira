import { getProfile } from '@/services/profileService'

export async function GET(req) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getProfile(userId)
    return Response.json({ profile })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return Response.json(
      { error: 'Failed to load profile', details: error.message },
      { status: 500 }
    )
  }
}