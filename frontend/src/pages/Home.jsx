import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getStats } from '../services/firestoreService'
import { useTheme } from '../components/ThemeContext'

export default function Home() {
  const { dark } = useTheme()
  const [stats, setStats] = useState({ lostCount: 0, foundCount: 0, matchCount: 0, reunitedCount: 0 })

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
        .hero-section { padding: 120px 80px 80px; }
        .features-top { grid-template-columns: repeat(4, 1fr); }
        .features-bottom { grid-template-columns: repeat(2, 1fr); max-width: 50%; }
        .stats-grid { grid-template-columns: repeat(4, 1fr); }
        .steps-grid { grid-template-columns: repeat(3, 1fr); }
        @media (max-width: 900px) {
          .features-top { grid-template-columns: repeat(2, 1fr) !important; }
          .features-bottom { max-width: 100% !important; grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .hero-section { padding: 100px 24px 60px !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .hero-section { padding: 90px 20px 50px !important; }
          .features-top { grid-template-columns: 1fr 1fr !important; }
          .features-bottom { grid-template-columns: 1fr 1fr !important; max-width: 100% !important; }
          .hero-buttons { flex-direction: column !important; }
          .hero-buttons a { text-align: center !important; justify-content: center !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Hero */}
      <div className="hero-gradient hero-section">
        <div style={{ maxWidth: 720, marginLeft: 0, marginRight: 'auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, marginBottom: 24, backgroundColor: dark ? 'rgba(108,99,255,0.12)' : 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#6c63ff', fontFamily: 'Inter', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00d4aa', display: 'inline-block' }} />
            Caleb University, Imota · Powered by VicFind AI
          </div>

          <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', color: 'var(--text)', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Lost something<br />
            <span style={{ color: '#6c63ff' }}>on campus?</span>
          </h1>

          <p style={{ fontFamily: 'Inter', fontSize: '1rem', color: 'var(--muted)', marginBottom: '2rem', lineHeight: 1.7, maxWidth: 540 }}>
            VicFind uses AI to match found items to their owners in minutes. Upload a photo — we handle the rest.
          </p>

          <div className="hero-buttons" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/report-lost" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.95rem', padding: '0.875rem 1.75rem' }}>
              🔴 Report Lost Item
            </Link>
            <Link to="/report-found" className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.95rem', padding: '0.875rem 1.75rem' }}>
              🟢 Report Found Item
            </Link>
            <Link to="/heatmap" className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.95rem', padding: '0.875rem 1.75rem', borderColor: '#00d4aa', color: '#00d4aa' }}>
              🗺️ Campus Heatmap
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div className="stats-grid" style={{ display: 'grid', gap: 20, marginBottom: 80 }}>
          {[
            { val: stats.lostCount, label: 'Active Lost Reports', color: '#ff4d6d', icon: '🔴' },
            { val: stats.foundCount, label: 'Items Found', color: '#00d4aa', icon: '🟢' },
            { val: stats.matchCount, label: 'AI Matches Made', color: '#6c63ff', icon: '🤖' },
            { val: stats.reunitedCount, label: 'Successful Reunions', color: '#f59e0b', icon: '🎉' },
          ].map(s => (
            <div key={s.label} className="card stat-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '2.2rem', color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', color: '#6c63ff', letterSpacing: '0.1em', marginBottom: 8 }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--text)' }}>From lost to found in 3 steps</h2>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gap: 24 }}>
            {[
              { n: '01', title: 'Report It', desc: 'Lost something? Fill in the details and submit. Found something? Upload front and back photos with your contact info.', color: '#ff4d6d' },
              { n: '02', title: 'AI Matches', desc: 'Our VicFind-powered AI analyzes photos and descriptions to find the best matches from the database with a confidence score.', color: '#6c63ff' },
              { n: '03', title: 'Safe Reunion', desc: 'Owner verifies via email, both parties get Reunion IDs to safely identify each other when meeting on campus.', color: '#00d4aa' },
            ].map(s => (
              <div key={s.n} className="card" style={{ padding: '2rem' }}>
                <div style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '2rem', color: s.color, marginBottom: 16, opacity: 0.8 }}>{s.n}</div>
                <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: 'Space Mono', fontSize: '0.75rem', color: '#6c63ff', letterSpacing: '0.1em', marginBottom: 8 }}>FEATURES</p>
          <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--text)' }}>Built for Caleb University</h2>
        </div>

        {/* Top row — 4 cards */}
        <div className="features-top" style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
          {[
            { icon: '🤖', title: 'AI Photo Matching', desc: 'VicFind AI compares found item photos against all lost reports with confidence scoring.' },
            { icon: '📸', title: 'Dual Photo Verification', desc: 'Finders upload front and back photos so owners can be 100% sure before confirming.' },
            { icon: '🔐', title: 'Reunion ID System', desc: 'Unique VF-OWN and VF-FND codes let both parties safely verify each other when meeting.' },
            { icon: '🗺️', title: 'Campus Heatmap', desc: 'Satellite map showing where items are lost and found across Caleb University campus.' },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 10 }}>{f.icon}</span>
              <h4 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginBottom: 6 }}>{f.title}</h4>
              <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom row — 2 cards centered */}
        <div className="features-bottom" style={{ display: 'grid', gap: 16, margin: '0 auto' }}>
          {[
            { icon: '📧', title: 'Two-Way Notifications', desc: 'Owner gets verify link. Finder gets owner contact + reward when owner confirms.' },
            { icon: '🛡️', title: 'Privacy Protected', desc: "Contact details stay hidden until owner confirms the item is theirs. No early exposure." },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: '1.25rem' }}>
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 10 }}>{f.icon}</span>
              <h4 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginBottom: 6 }}>{f.title}</h4>
              <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}