export default function SkeletonCard() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ebebeb',
      borderRadius: 10, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8,
    }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: 140, height: 12, borderRadius: 6, background: '#f0f0f0', marginBottom: 8 }} />
        <div style={{ width: 200, height: 10, borderRadius: 6, background: '#f5f5f5', marginBottom: 8 }} />
        <div style={{ width: 70, height: 18, borderRadius: 20, background: '#f5f5f5' }} />
      </div>
    </div>
  )
}