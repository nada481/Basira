import { IconAddUser } from './icons'

export default function AddCard({ label, sublabel }) {
  return (
    <div
      role="button"
      tabIndex={0}
      style={{
        background: '#fff', border: '1.5px dashed #ddd',
        borderRadius: 10, padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', marginBottom: 8, color: '#999',
        transition: 'border-color .15s, color .15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#7a1040'; e.currentTarget.style.color = '#7a1040' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#999' }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: '50%',
        background: '#f5f5f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconAddUser />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>{sublabel}</div>
      </div>
    </div>
  )
}