const AVATAR_COLORS = ['#7a1040', '#1565c0', '#2e7d32', '#6a1b9a', '#b45309']

function getInitial(profile) {
  const name = profile?.display_name ?? profile?.full_name ?? profile?.email ?? '?'
  return name.charAt(0).toUpperCase()
}

export default function Avatar({ profile, index = 0 }) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile?.display_name ?? profile?.full_name ?? 'User'}
        style={{
          width: 46, height: 46, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid #f0e0e8',
        }}
      />
    )
  }

  return (
    <div style={{
      width: 46, height: 46, borderRadius: '50%',
      background: AVATAR_COLORS[index % AVATAR_COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 17, fontWeight: 600, color: '#fff',
      flexShrink: 0, border: '2px solid #f0e0e8',
    }}>
      {getInitial(profile)}
    </div>
  )
}