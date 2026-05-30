import { Link } from 'react-router-dom'
import { useTheme } from './ThemeContext'

export default function Footer() {
  const { dark } = useTheme()
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 80, padding: '2rem 1.5rem', backgroundColor: dark ? '#0a0a14' : '#ede9ff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 100 100" fill="none">
            <circle cx="40" cy="40" r="28" stroke="#6c63ff" strokeWidth="8"/>
            <line x1="60" y1="60" x2="85" y2="85" stroke="#6c63ff" strokeWidth="8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>VicFind</span>
        </div>
        <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)' }}>AI-powered campus lost & found · Powered by VicFind AI</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)' }}>Caleb University, Imota · Smart Campus</p>
          <Link to="/admin" style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: dark ? '#1e1e30' : '#c4beff', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#6c63ff'}
            onMouseLeave={e => e.target.style.color = dark ? '#1e1e30' : '#c4beff'}>
            admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
