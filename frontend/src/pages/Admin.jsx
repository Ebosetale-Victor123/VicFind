import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getLostItems, getFoundItems, getNotifications, markItemClaimed, markItemActive, deleteLostItem, deleteFoundItem, deleteNotification, clearAllData } from '../services/firestoreService'
import { useToast } from '../components/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { Lock, RefreshCw, Trash2, Circle, Bot, PartyPopper, CheckCircle2, RotateCcw, User, Mail, MapPin, Calendar, Phone, LogOut } from 'lucide-react'

function StatCard({ value, label, color, Icon, fill }) {
  return (
    <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <Icon size={22} color={color} {...(fill ? { fill: color, strokeWidth: 0 } : {})} />
      </div>
      <div style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.8rem', color }}>{value}</div>
      <div style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function Admin() {
  const { addToast } = useToast()
  const [authed, setAuthed] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab] = useState('lost')
  const [lostItems, setLostItems] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) { setAuthed(true); loadData() }
      else setAuthed(false)
      setAuthChecking(false)
    })
    return unsub
  }, [])

  async function login() {
    if (!email.trim() || !password) { setLoginError('Enter your email and password.'); return }
    setLoginLoading(true)
    setLoginError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // onAuthStateChanged above will set authed + load data
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'Wrong email or password.'
        : 'Login failed. Check your connection and try again.'
      setLoginError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    setAuthed(false)
    setLostItems([]); setFoundItems([]); setNotifications([])
  }

  async function loadData() {
    setLoading(true)
    try {
      const [lost, found, notifs] = await Promise.all([getLostItems(), getFoundItems(), getNotifications()])
      setLostItems(lost); setFoundItems(found); setNotifications(notifs)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleClearAll() {
    setClearing(true)
    try { await clearAllData(); setLostItems([]); setFoundItems([]); setNotifications([]); setConfirmClear(false) }
    catch (err) { console.error(err) }
    finally { setClearing(false) }
  }

  const activeCount = lostItems.filter(i => i.status === 'active').length
  const reunitedCount = lostItems.filter(i => ['reunited', 'claimed'].includes(i.status)).length
  const highConfMatches = notifications.filter(n => n.confidence >= 70).length

  const statusStyle = (status) => ({
    fontSize: '0.65rem', fontFamily: 'Inter', fontWeight: 700,
    padding: '2px 8px', borderRadius: 999,
    backgroundColor: status === 'active' ? 'rgba(0,212,170,0.12)' : status === 'reunited' ? 'rgba(108,99,255,0.12)' : 'rgba(245,158,11,0.12)',
    color: status === 'active' ? '#00d4aa' : status === 'reunited' ? '#6c63ff' : '#f59e0b',
  })

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'var(--bg)' }}>
        <div className="card" style={{ padding: '2.5rem', maxWidth: 380, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Lock size={36} color="#6c63ff" /></div>
            <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text)', margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontFamily: 'Inter', color: 'var(--muted)', fontSize: '0.85rem', marginTop: 6 }}>VicFind · Caleb University</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input className="input-base" type="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} style={{ borderColor: loginError ? '#ff4d6d' : undefined }} />
            <input className="input-base" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} style={{ borderColor: loginError ? '#ff4d6d' : undefined }} />
            {loginError && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#ff4d6d', margin: 0 }}>{loginError}</p>}
            <button className="btn-primary" style={{ justifyContent: 'center', padding: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={login} disabled={loginLoading}>
              {loginLoading ? <><LoadingSpinner size="sm" /> Signing in...</> : 'Enter Dashboard'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '7rem 1.5rem 4rem' }}>
      <style>{`
        .admin-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
        .item-row { display: flex; gap: 16px; align-items: flex-start; }
        .item-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        @media (max-width: 700px) {
          .admin-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .item-row { flex-direction: column !important; }
          .item-actions { flex-direction: row !important; width: 100%; }
          .item-actions button { flex: 1; }
        }
        @media (max-width: 480px) {
          .admin-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="admin-header">
          <div>
            <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><Lock size={24} color="#6c63ff" /> Admin Dashboard</h1>
            <p style={{ fontFamily: 'Inter', color: 'var(--muted)', margin: '4px 0 0', fontSize: '0.875rem' }}>VicFind Control Center · Caleb University</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={loadData}><RefreshCw size={15} /> Refresh</button>
            <button className="btn-ghost" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={handleSignOut}><LogOut size={15} /> Sign Out</button>
            {!confirmClear ? (
              <button onClick={() => setConfirmClear(true)} style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.4)', color: '#ff4d6d', fontFamily: 'Inter', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={15} /> Clear All</button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: '#ff4d6d' }}>Are you sure?</span>
                <button onClick={handleClearAll} disabled={clearing} style={{ background: '#ff4d6d', border: 'none', color: '#fff', fontFamily: 'Inter', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>{clearing ? 'Clearing...' : 'Yes, Delete All'}</button>
                <button onClick={() => setConfirmClear(false)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Inter', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        <div className="admin-stats" style={{ marginBottom: 32 }}>
          <StatCard value={activeCount} label="Active Lost Items" color="#ff4d6d" Icon={Circle} fill />
          <StatCard value={foundItems.length} label="Found Reports" color="#00d4aa" Icon={Circle} fill />
          <StatCard value={highConfMatches} label="AI Matches Made" color="#6c63ff" Icon={Bot} />
          <StatCard value={reunitedCount} label="Items Reunited" color="#f59e0b" Icon={PartyPopper} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {[{ key: 'lost', label: `Lost (${lostItems.length})`, Icon: Circle, color: '#ff4d6d' }, { key: 'found', label: `Found (${foundItems.length})`, Icon: Circle, color: '#00d4aa' }, { key: 'matches', label: `Matches (${notifications.length})`, Icon: Bot, color: '#6c63ff' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontFamily: 'Inter', fontWeight: 500, fontSize: '0.875rem', padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid',
              borderColor: tab === t.key ? '#6c63ff' : 'var(--border)',
              backgroundColor: tab === t.key ? 'rgba(108,99,255,0.15)' : 'transparent',
              color: tab === t.key ? '#6c63ff' : 'var(--muted)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <t.Icon size={14} color={t.key === 'matches' ? undefined : t.color} {...(t.key !== 'matches' ? { fill: t.color, strokeWidth: 0 } : {})} /> {t.label}
            </button>
          ))}
        </div>

        {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><LoadingSpinner size="lg" /></div> : (
          <>
            {tab === 'lost' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lostItems.length === 0 ? <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><p style={{ fontFamily: 'Space Mono', color: 'var(--muted)' }}>No lost items in database</p></div>
                : lostItems.map(item => (
                  <div key={item.id} className="card" style={{ padding: '1.25rem' }}>
                    <div className="item-row">
                      {item.photo && <img src={item.photo} alt="" style={{ width: 60, height: 60, borderRadius: '0.625rem', objectFit: 'cover', flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>{item.itemName}</h3>
                          <span style={statusStyle(item.status)}>{item.status === 'reunited' ? 'REUNITED' : item.status?.toUpperCase()}</span>
                        </div>
                        <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><User size={13} /> {item.name} · <Mail size={13} /> {item.email}</p>
                        <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><MapPin size={13} /> {item.location} · <Calendar size={13} /> {item.dateLost}</p>
                        {item.ownerReunionId && <p style={{ fontFamily: 'Space Mono', fontSize: '0.72rem', color: 'var(--muted)', margin: 0 }}>ID: <span style={{ color: '#6c63ff' }}>{item.ownerReunionId}</span></p>}
                      </div>
                      <div className="item-actions">
                        {item.status !== 'reunited' && (
                          item.status === 'active'
                            ? <button onClick={async () => { try { await markItemClaimed(item.id); setLostItems(p => p.map(i => i.id === item.id ? { ...i, status: 'claimed' } : i)) } catch (err) { console.error(err); addToast('Could not update item — please try again.', 'error') } }} style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontFamily: 'Inter', fontWeight: 600, padding: '0.4rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}><CheckCircle2 size={13} /> Claimed</button>
                            : <button onClick={async () => { try { await markItemActive(item.id); setLostItems(p => p.map(i => i.id === item.id ? { ...i, status: 'active' } : i)) } catch (err) { console.error(err); addToast('Could not update item — please try again.', 'error') } }} style={{ background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.4)', color: '#00d4aa', fontFamily: 'Inter', fontWeight: 600, padding: '0.4rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}><RotateCcw size={13} /> Reactivate</button>
                        )}
                        <button onClick={async () => { try { await deleteLostItem(item.id); setLostItems(p => p.filter(i => i.id !== item.id)) } catch (err) { console.error(err); addToast('Could not delete item — please try again.', 'error') } }} style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontFamily: 'Inter', fontWeight: 600, padding: '0.4rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'found' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {foundItems.length === 0 ? <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><p style={{ fontFamily: 'Space Mono', color: 'var(--muted)' }}>No found items in database</p></div>
                : foundItems.map(item => (
                  <div key={item.id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 0 }}>
                        {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: 60, height: 60, borderRadius: '0.625rem', objectFit: 'cover', flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.9rem' }}>Found by {item.finderName}</h3>
                            {item.status === 'reunited' && <span style={statusStyle('reunited')}>REUNITED</span>}
                          </div>
                          <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><Phone size={13} /> {item.finderPhone || 'N/A'} · <MapPin size={13} /> {item.location}</p>
                          {item.finderReunionId && <p style={{ fontFamily: 'Space Mono', fontSize: '0.72rem', color: 'var(--muted)', margin: 0 }}>ID: <span style={{ color: '#00d4aa' }}>{item.finderReunionId}</span></p>}
                        </div>
                      </div>
                      <button onClick={async () => { try { await deleteFoundItem(item.id); setFoundItems(p => p.filter(i => i.id !== item.id)) } catch (err) { console.error(err); addToast('Could not delete item — please try again.', 'error') } }} style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontFamily: 'Inter', fontWeight: 600, padding: '0.4rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'matches' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {notifications.length === 0 ? <div className="card" style={{ padding: '3rem', textAlign: 'center' }}><p style={{ fontFamily: 'Space Mono', color: 'var(--muted)' }}>No AI matches yet</p></div>
                : notifications.map(notif => (
                  <div key={notif.id} className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.1rem', color: notif.confidence >= 70 ? '#00d4aa' : notif.confidence >= 40 ? '#f59e0b' : '#ff4d6d' }}>{notif.confidence}%</span>
                          <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', margin: 0, fontSize: '0.95rem' }}>{notif.itemName}</h3>
                          <span style={{ fontSize: '0.65rem', fontFamily: 'Inter', padding: '2px 8px', borderRadius: 999, backgroundColor: notif.confidence >= 70 ? 'rgba(0,212,170,0.12)' : 'rgba(245,158,11,0.12)', color: notif.confidence >= 70 ? '#00d4aa' : '#f59e0b' }}>{notif.confidence >= 70 ? 'HIGH' : 'MEDIUM'}</span>
                        </div>
                        <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 2px' }}>Owner: <strong style={{ color: 'var(--text)' }}>{notif.ownerName}</strong> · {notif.ownerEmail}</p>
                        <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                      <button onClick={async () => { try { await deleteNotification(notif.id); setNotifications(p => p.filter(i => i.id !== notif.id)) } catch (err) { console.error(err); addToast('Could not delete notification — please try again.', 'error') } }} style={{ background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.3)', color: '#ff4d6d', fontFamily: 'Inter', fontWeight: 600, padding: '0.4rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}