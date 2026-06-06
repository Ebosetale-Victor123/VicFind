import { useTheme } from './ThemeContext'
import { Palette, MapPin, Calendar, Wallet } from 'lucide-react'

const statusColor = {
  active: { bg: 'rgba(255,77,109,0.1)', color: '#ff4d6d', border: 'rgba(255,77,109,0.3)' },
  claimed: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  reunited: { bg: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: 'rgba(0,212,170,0.3)' },
}

export default function ItemCard({ item }) {
  const { dark } = useTheme()
  const s = statusColor[item.status] || statusColor.active

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>

      {item.photo && (
        <img src={item.photo} alt={item.itemName} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '0.625rem', border: '1px solid var(--border)' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', margin: 0 }}>{item.itemName}</h3>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0 }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'Inter', fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(108,99,255,0.12)', color: '#6c63ff', border: '1px solid rgba(108,99,255,0.2)', whiteSpace: 'nowrap' }}>{item.category}</span>
          <span style={{ fontSize: '0.65rem', fontFamily: 'Inter', fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>{item.status?.toUpperCase()}</span>
        </div>
      </div>

      <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>

      {item.imei && (
        <p style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: '#6c63ff', margin: 0 }}>IMEI/Serial: {item.imei}</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Palette size={13} /> {item.color}</span>
        <span style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {item.location}</span>
        <span style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {item.dateLost}</span>
      </div>

      <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>By <strong style={{ color: 'var(--text)' }}>{item.name}</strong></p>

      {item.reward && (
        <div style={{ padding: '6px 10px', borderRadius: '0.5rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#f59e0b', margin: 0, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}><Wallet size={13} /> Reward: {item.reward}</p>
        </div>
      )}
    </div>
  )
}