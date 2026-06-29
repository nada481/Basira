import Avatar from './Avatar'
import RolePill from './RolePill'
import StatusBadge from './StatusBadge'
import { IconMessage, IconProgress, IconMore } from './icons'

function getDisplayName(profile) {
  return profile?.display_name ?? profile?.full_name ?? profile?.email ?? 'Unknown'
}

function getRoleName(profile) {
  return profile?.roles?.name ?? 'Member'
}

export default function ConnCard({ profile, index = 0, showProgress = false }) {
  return (
    <div
      style={{
        background: '#fff', border: '1px solid #ebebeb',
        borderRadius: 10, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 8, transition: 'border-color .15s, box-shadow .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#d8c5cf'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(122,16,64,.06)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#ebebeb'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <Avatar profile={profile} index={index} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
          {getDisplayName(profile)}
        </div>
        {profile?.email && (
          <div style={{ fontSize: 12, color: '#999', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.email}
          </div>
        )}
        <div style={{ marginTop: 4 }}>
          <RolePill role={getRoleName(profile)} />
        </div>
        <StatusBadge connected />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button style={btnStyle()}>
          <IconMessage /> Contact
        </button>
        {showProgress && (
          <button style={btnStyle(true)}>
            <IconProgress /> View Progress
          </button>
        )}
        <button aria-label="More options" style={moreStyle()}>
          <IconMore />
        </button>
      </div>
    </div>
  )
}

function btnStyle(primary = false) {
  return {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 500,
    padding: '5px 12px', borderRadius: 20,
    border: primary ? 'none' : '1px solid #e0e0e0',
    background: primary ? '#7a1040' : 'none',
    color: primary ? '#fff' : '#555',
    cursor: 'pointer', whiteSpace: 'nowrap',
  }
}

function moreStyle() {
  return {
    width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#bbb', borderRadius: 6,
  }
}