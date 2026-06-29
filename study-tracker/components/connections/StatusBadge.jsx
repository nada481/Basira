export default function StatusBadge({ connected = true }) {
  const color = connected ? '#2e7d32' : '#b45309'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.3px' }}>
        Status: {connected ? 'Connected' : 'Pending'}
      </span>
    </div>
  )
}