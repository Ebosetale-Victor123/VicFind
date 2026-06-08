import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getLostItemById, getFoundItemById, markItemReunited } from '../services/firestoreService'
import { sendFinderEmail, sendOwnerReunionEmail } from '../services/emailService'
import { useToast } from '../components/ToastContext'
import { useTheme } from '../components/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { PartyPopper, Mail, Phone, MapPin, Map, Lightbulb, Wallet, CheckCircle2, XCircle, Search, HelpCircle, Palette } from 'lucide-react'

export default function Verify() {
  const { lostItemId, foundItemId } = useParams()
  const { dark } = useTheme()
  const { addToast } = useToast()
  const [lostItem, setLostItem] = useState(null)
  const [foundItem, setFoundItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [lost, found] = await Promise.all([
          getLostItemById(lostItemId),
          getFoundItemById(foundItemId)
        ])
        setLostItem(lost)
        setFoundItem(found)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lostItemId, foundItemId])

  async function handleConfirm() {
    setProcessing(true)
    try {
      await markItemReunited(lostItemId, foundItemId)

      if (foundItem.finderEmail) {
        await sendFinderEmail({
          finderName: foundItem.finderName,
          finderEmail: foundItem.finderEmail,
          ownerName: lostItem.name,
          ownerPhone: lostItem.phone,
          itemName: lostItem.itemName,
          reward: lostItem.reward,
          ownerReunionId: lostItem.ownerReunionId,
          finderReunionId: foundItem.finderReunionId,
          imei: lostItem.imei,
          category: lostItem.category,
          privateDetails: lostItem.privateDetails,
        })
      }

      await sendOwnerReunionEmail({
        ownerName: lostItem.name,
        ownerEmail: lostItem.email,
        itemName: lostItem.itemName,
        finderName: foundItem.finderName,
        finderPhone: foundItem.finderPhone,
        ownerReunionId: lostItem.ownerReunionId,
        finderReunionId: foundItem.finderReunionId,
        reward: lostItem.reward,
        foundLocation: foundItem.location,
      })

      setDecision('confirmed')
    } catch (err) {
      console.error(err)
      addToast('Something went wrong confirming this — please check your connection and try again.', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size="lg" />
    </div>
  )

  if (!lostItem || !foundItem) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ padding: '2.5rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><HelpCircle size={48} color="var(--muted)" /></div>
          <p style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Item not found</p>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)', marginBottom: 24 }}>This verification link may have expired or already been used.</p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>Go Home</Link>
        </div>
      </div>
    )
  }

  if (lostItem.status === 'reunited' || decision === 'confirmed') {
    const gps = foundItem.gps
    const mapsUrl = gps
      ? `https://maps.google.com/?q=${gps.lat},${gps.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(foundItem.location + ', Caleb University, Imota, Lagos')}`

    return (
      <div style={{ minHeight: '100vh', padding: '6rem 1.5rem 4rem', display: 'flex', justifyContent: 'center' }}>
        <div className="card animate-fade-up" style={{ padding: '2.5rem', maxWidth: 600, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><PartyPopper size={48} color="#00d4aa" /></div>
            <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.5rem', color: '#00d4aa', marginBottom: 6 }}>Reunited!</h2>
            <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>Your item has been marked as returned. Contact the finder to arrange pickup.</p>
          </div>

          <div style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Mail size={20} color="#6c63ff" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: 'Inter', fontWeight: 700, color: '#6c63ff', margin: '0 0 4px', fontSize: '0.9rem' }}>
                Check your email!
              </p>
              <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                A full summary with the finder's contact and both Reunion IDs has been sent to <strong style={{ color: 'var(--text)' }}>{lostItem.email}</strong> — save it before you go meet the finder.
              </p>
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: dark ? 'rgba(0,212,170,0.08)' : 'rgba(0,184,150,0.08)', border: '1px solid rgba(0,212,170,0.25)', marginBottom: 16 }}>
            <p style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 8, letterSpacing: '0.05em' }}>FINDER'S CONTACT</p>
            <p style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: 6 }}>{foundItem.finderName}</p>
            {foundItem.finderPhone && (
              <a href={`tel:${foundItem.finderPhone}`} style={{ fontFamily: 'Inter', color: '#00d4aa', fontWeight: 700, fontSize: '1.15rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Phone size={18} /> {foundItem.finderPhone}
              </a>
            )}
            <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> Found at: {foundItem.location}
            </p>
            <a href={mapsUrl} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontWeight: 600, fontSize: '0.85rem', color: '#6c63ff', textDecoration: 'none', padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(108,99,255,0.3)', backgroundColor: 'rgba(108,99,255,0.08)', transition: 'all 0.2s' }}>
              <Map size={16} /> View found location on Google Maps
            </a>
          </div>

          <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: dark ? 'rgba(108,99,255,0.08)' : 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', marginBottom: 16 }}>
            <p style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.05em' }}>REUNION VERIFICATION CODES</p>
            <p style={{ fontFamily: 'Inter', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 12 }}>
              When you meet the finder, say your code first — they should confirm theirs matches too.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', flexShrink: 0 }}>Your code:</span>
                <span className="reunion-badge reunion-owner">{lostItem.ownerReunionId}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', flexShrink: 0 }}>Finder's code:</span>
                <span className="reunion-badge reunion-finder">{foundItem.finderReunionId}</span>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: '0.5rem', backgroundColor: 'rgba(108,99,255,0.08)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <Lightbulb size={14} color="var(--muted)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
                These codes are also in your email — screenshot this page or check your inbox before the meetup.
              </p>
            </div>
          </div>

          {lostItem.reward && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', marginBottom: 16 }}>
              <p style={{ fontFamily: 'Inter', fontWeight: 600, color: '#f59e0b', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={16} /> Don't forget your reward: {lostItem.reward}</p>
            </div>
          )}

          {foundItem.finderEmail && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#00d4aa" style={{ flexShrink: 0 }} />
              <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                <strong style={{ color: 'var(--text)' }}>{foundItem.finderName}</strong> has been notified by email with your contact details, reward info, and both Reunion IDs.
              </p>
            </div>
          )}

          <Link to="/" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'center', width: '100%' }}>Back to VicFind</Link>
        </div>
      </div>
    )
  }

  if (decision === 'denied') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ padding: '2.5rem', maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><XCircle size={48} color="#ff4d6d" /></div>
          <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text)', marginBottom: 8 }}>Not Your Item</h2>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)', marginBottom: 24 }}>No problem! Your lost item report is still active. We'll notify you if another match is found.</p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center' }}>Back to VicFind</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '6rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Search size={44} color="#6c63ff" /></div>
          <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.8rem', color: 'var(--text)', marginBottom: 8 }}>Is this your item?</h1>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>Someone found an item that may be yours. Review both photos carefully before confirming.</p>
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 16 }}>
          <p style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.05em' }}>YOUR LOST ITEM REPORT</p>
          <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{lostItem.itemName}</h3>
          <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Palette size={14} /> {lostItem.color}</p>
          <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Lost at: {lostItem.location}</p>
          <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)' }}>{lostItem.description}</p>
          {lostItem.photo && (
            <img src={lostItem.photo} alt="your item" style={{ width: '100%', borderRadius: '0.625rem', marginTop: 12, maxHeight: 180, objectFit: 'cover', border: '1px solid var(--border)' }} />
          )}
        </div>

        <div className="card" style={{ padding: '1.25rem', marginBottom: 24 }}>
          <p style={{ fontFamily: 'Space Mono', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 10, letterSpacing: '0.05em' }}>FOUND ITEM PHOTOS</p>
          <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} /> Found at: <strong style={{ color: 'var(--text)' }}>{foundItem.location}</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: foundItem.backImageUrl ? '1fr 1fr' : '1fr', gap: 12 }}>
            {foundItem.imageUrl && (
              <div>
                <p style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6 }}>FRONT</p>
                <img src={foundItem.imageUrl} alt="front" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '0.625rem', border: '1px solid var(--border)' }} />
              </div>
            )}
            {foundItem.backImageUrl && (
              <div>
                <p style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6 }}>BACK</p>
                <img src={foundItem.backImageUrl} alt="back" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '0.625rem', border: '1px solid var(--border)' }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <button onClick={() => setDecision('denied')}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.4)', color: '#ff4d6d', fontFamily: 'Inter', fontWeight: 600, padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '1rem' }}>
            <XCircle size={18} /> Not My Item
          </button>
          <button onClick={handleConfirm} disabled={processing}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.4)', color: '#00d4aa', fontFamily: 'Inter', fontWeight: 600, padding: '1rem', borderRadius: '0.75rem', cursor: 'pointer', fontSize: '1rem' }}>
            {processing ? 'Processing...' : <><CheckCircle2 size={18} /> Yes, That's Mine!</>}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)' }}>
          If confirmed, both you and the finder will receive each other's contact details and Reunion IDs by email.
        </p>
      </div>
    </div>
  )
}