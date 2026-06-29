

const STYLES = {
  teacher:  { bg: '#e8f5e9', color: '#2e7d32' },
  parent:   { bg: '#fff3e0', color: '#b45309' },
  guardian: { bg: '#fce4ec', color: '#880e4f' },
  student:  { bg: '#e3f2fd', color: '#1565c0' },
}

export default function RolePill({ role }) {
  const style = STYLES[role?.toLowerCase()] ?? { bg: '#f3e5f5', color: '#6a1b9a' }
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 600,
      letterSpacing: '.4px', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 20,
      background: style.bg, color: style.color,
    }}>
      {role}
    </span>
  )
}