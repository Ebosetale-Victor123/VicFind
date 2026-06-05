import { useTheme } from './ThemeContext'
import { CheckCircle2, AlertTriangle, Mail } from 'lucide-react'

function Ring({ confidence }) {
  const r = 28, circ = 2 * Math.PI * r
  const offset = circ - (confidence / 100) * circ
  const color = confidence >= 70 ? '#00d4aa' : confidence >= 40 ? '#f59e0b' : '#ff4d6d'
  return (
    <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(108,99,255,0.15)" strokeWidth="5"/>
        <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out' }}/>
      </svg>
      <span style={{ position: 'absolute', fontFamily: 'Space Mono', fontWeight: 700, fontSize: '0.85rem', color, lineHeight: 1 }}>{confidence}%</span>
    </div>
  )
}

export default function MatchCard({ match, onNotify, notified, notifying }) {
  const { dark } = useTheme()
  const c = match.confidence || 0
  const glow = c >= 70 ? 'rgba(0,212,170,0.08)' : c >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(255,77,109,0.08)'
  const border = c >= 70 ? 'rgba(0,212,170,0.3)' : c >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(255,77,109,0.3)'

  return (
    <div style={{ borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', backgroundColor: glow, border: `1px solid ${border}`, boxShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <Ring confidence={c} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', fontSize: '0.95rem' }}>{match.itemName}</h4>
          <p style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
            Owner: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{match.ownerName}</span>
          </p>
          <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: '2px 0 0' }}>
            Contact details revealed after owner confirms
          </p>
        </div>
      </div>

      {match.reasoning && (
        <p style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{match.reasoning}</p>
      )}

      {onNotify && (
        notified ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)' }}>
            <CheckCircle2 size={18} color="#00d4aa" style={{ flexShrink: 0 }} />
            <p style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: '#00d4aa', margin: 0, fontWeight: 600 }}>Owner notified! They'll get an email to verify.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color="#f59e0b" /> Only notify if you're confident this is the right match
            </p>
            <button onClick={onNotify} disabled={notifying} className="btn-primary" style={{ justifyContent: 'center', fontSize: '0.875rem', padding: '0.65rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {notifying ? 'Sending...' : <><Mail size={16} /> Notify Owner to Verify</>}
            </button>
          </div>
        )
      )}
    </div>
  )
}