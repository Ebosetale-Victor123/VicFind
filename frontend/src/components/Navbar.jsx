import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from './ThemeContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/report-lost', label: 'Report Lost' },
  { to: '/report-found', label: 'Report Found' },
  { to: '/items', label: 'Browse' },
  { to: '/heatmap', label: 'Heatmap' },
  { to: '/matches', label: 'Matches' },
]

export default function Navbar() {
  const { dark, toggle } = useTheme()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="navbar">
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setMenuOpen(false)}>
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none">
              <circle cx="40" cy="40" r="28" stroke="#6c63ff" strokeWidth="8"/>
              <line x1="60" y1="60" x2="85" y2="85" stroke="#6c63ff" strokeWidth="8" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>VicFind</span>
            <span style={{ fontSize: '0.65rem', fontFamily: 'Inter', fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(108,99,255,0.15)', color: '#6c63ff', border: '1px solid rgba(108,99,255,0.3)', letterSpacing: '0.05em' }}>CALEB UNI</span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {links.map(l => (
              <Link key={l.to} to={l.to} style={{
                textDecoration: 'none',
                fontFamily: 'Inter', fontWeight: 500, fontSize: '0.85rem',
                padding: '0.4rem 0.85rem', borderRadius: '0.5rem',
                color: pathname === l.to ? '#ffffff' : 'var(--muted)',
                backgroundColor: pathname === l.to ? '#6c63ff' : 'transparent',
                transition: 'all 0.15s',
              }}>
                {l.label}
              </Link>
            ))}
            <button onClick={toggle} style={{
              marginLeft: 8, width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Mobile right: theme + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="mobile-nav">
            <button onClick={toggle} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setMenuOpen(o => !o)} style={{
              width: 36, height: 36, borderRadius: '0.5rem',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <span style={{ display: 'block', width: 16, height: 2, backgroundColor: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
              <span style={{ display: 'block', width: 16, height: 2, backgroundColor: 'var(--text)', borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'all 0.2s' }} />
              <span style={{ display: 'block', width: 16, height: 2, backgroundColor: 'var(--text)', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-nav" style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999,
          backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)',
          padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none', fontFamily: 'Inter', fontWeight: 500, fontSize: '0.95rem',
              padding: '0.75rem 1rem', borderRadius: '0.5rem',
              color: pathname === l.to ? '#ffffff' : 'var(--text)',
              backgroundColor: pathname === l.to ? '#6c63ff' : 'transparent',
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .desktop-nav { display: flex !important; }
        .mobile-nav { display: none !important; }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </>
  )
}