export default function SectionHeader({ icon, label, right, iconBg }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '28px 0 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: iconBg ?? '#f0eeff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        {label}
      </div>
      {right}
    </div>
  )
}