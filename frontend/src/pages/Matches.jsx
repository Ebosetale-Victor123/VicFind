import { useState, useEffect } from 'react'
import { getNotifications } from '../services/firestoreService'
import LoadingSpinner from '../components/LoadingSpinner'
import { Bot } from 'lucide-react'

export default function Matches() {
  const [notifications, setNotifications] = useState(() => {
    try {
      const cached = localStorage.getItem('vicfind_cache_notifications')
      return cached ? JSON.parse(cached) : []
    } catch { return [] }
  })
  const [loading, setLoading] = useState(notifications.length === 0)

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', padding: '7rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>AI Matches</h1>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>All match notifications sent to item owners.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><LoadingSpinner size="lg" /></div>
        ) : notifications.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><Bot size={44} color="#6c63ff" /></div>
            <p style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 8 }}>No matches yet</p>
            <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>AI matches will appear here when finders notify owners.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {notifications.map(n => {
              const color = n.confidence >= 70 ? '#00d4aa' : n.confidence >= 40 ? '#f59e0b' : '#ff4d6d'
              return (
                <div key={n.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.2rem', color }}>{n.confidence}%</span>
                    <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>{n.itemName}</h3>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'Inter', padding: '2px 8px', borderRadius: 999, backgroundColor: n.confidence >= 70 ? 'rgba(0,212,170,0.12)' : 'rgba(245,158,11,0.12)', color: n.confidence >= 70 ? '#00d4aa' : '#f59e0b' }}>
                      {n.confidence >= 70 ? 'HIGH CONFIDENCE' : 'MEDIUM'}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 4px' }}>
                    Owner: <strong style={{ color: 'var(--text)' }}>{n.ownerName}</strong> · {n.ownerEmail}
                  </p>
                  <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}