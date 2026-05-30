import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card" style={{ padding: '3rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.5rem', color: 'var(--text)', marginBottom: 8 }}>Page not found</h1>
        <p style={{ fontFamily: 'Inter', color: 'var(--muted)', marginBottom: 24 }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>Go Home</Link>
      </div>
    </div>
  )
}
