import { useState, useRef, useEffect } from 'react'
import { getLostItems, addFoundItem, addNotification } from '../services/firestoreService'
import { analyzeFoundItem } from '../services/geminiService'
import { sendMatchEmail } from '../services/emailService'
import { useToast } from '../components/ToastContext'
import { useTheme } from '../components/ThemeContext'
import MatchCard from '../components/MatchCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { Camera, FolderOpen, Trash2, Bot, MapPin, Search } from 'lucide-react'

const DRAFT_KEY = 'vicfind_found_draft'
const NOTIFIED_KEY = 'vicfind_found_draft_notified'

function PhotoZone({ label, hint, preview, onFile, error, fileRef, cameraRef, required }) {
  const [dragging, setDragging] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
        {label} {required && <span style={{ color: '#ff4d6d' }}>*</span>}
      </label>
      {hint && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{hint}</p>}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { onFile(e.target.files[0]); setShowOptions(false) }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { onFile(e.target.files[0]); setShowOptions(false) }} />

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]); setShowOptions(false) }}
        onClick={() => setShowOptions(o => !o)}
        style={{
          borderRadius: '0.75rem', border: `2px dashed ${dragging ? '#6c63ff' : error ? '#ff4d6d' : 'var(--border)'}`,
          backgroundColor: dragging ? 'rgba(108,99,255,0.08)' : 'var(--surface)',
          minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s',
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ width: '100%', objectFit: 'cover', maxHeight: 160 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16, textAlign: 'center' }}>
            <Camera size={28} color="var(--muted)" />
            <p style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)', margin: 0 }}>Click to upload</p>
            <p style={{ fontFamily: 'Inter', fontSize: '0.72rem', color: 'var(--muted)', margin: 0 }}>PNG, JPG, WEBP</p>
          </div>
        )}
      </div>

      {showOptions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}>
          <button type="button" onClick={() => { cameraRef.current.click(); setShowOptions(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>
            <Camera size={18} /> Take Photo
          </button>
          <button type="button" onClick={() => { fileRef.current.click(); setShowOptions(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>
            <FolderOpen size={18} /> Choose from Files
          </button>
          {preview && (
            <button type="button" onClick={() => { onFile(null); setShowOptions(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(255,77,109,0.3)', backgroundColor: 'rgba(255,77,109,0.08)', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600, fontSize: '0.85rem', color: '#ff4d6d' }}>
              <Trash2 size={18} /> Remove Photo
            </button>
          )}
        </div>
      )}

      {error && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#ff4d6d', margin: 0 }}>{error}</p>}
    </div>
  )
}

function compressForStorage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxW = 600
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

function compressForAI(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const maxW = 800
      const scale = Math.min(1, maxW / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.7).split(',')[1])
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

export default function ReportFound() {
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {} } catch { return {} }
  })()

  const [frontImage, setFrontImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [finderName, setFinderName] = useState(cached.finderName || '')
  const [finderPhone, setFinderPhone] = useState(cached.finderPhone || '')
  const [finderEmail, setFinderEmail] = useState(cached.finderEmail || '')
  const [location, setLocation] = useState(cached.location || '')
  const [notes, setNotes] = useState(cached.notes || '')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState(null)
  const [errors, setErrors] = useState({})
  const [gps, setGps] = useState(null)
  const [foundItemId, setFoundItemId] = useState(null)
  const [finderReunionId, setFinderReunionId] = useState(null)
  const [notifiedMatches, setNotifiedMatches] = useState({})
  const [notifying, setNotifying] = useState({})
  const draftToastShown = useRef(false)
  const frontRef = useRef()
  const backRef = useRef()
  const frontCameraRef = useRef()
  const backCameraRef = useRef()
  const { addToast } = useToast()
  const { dark } = useTheme()

  // Save text fields to localStorage on change
  useEffect(() => {
    const draft = { finderName, finderPhone, finderEmail, location, notes }
    try {
      if (Object.values(draft).some(v => v)) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {}
  }, [finderName, finderPhone, finderEmail, location, notes])

  // Show "restored" toast at most ONCE per browser session (survives navigation + StrictMode)
  useEffect(() => {
    if (draftToastShown.current) return
    draftToastShown.current = true
    try {
      if (sessionStorage.getItem(NOTIFIED_KEY)) return
      if (cached.finderName || cached.finderPhone || cached.finderEmail || cached.location || cached.notes) {
        addToast('Restored your unsaved details.', 'info')
        sessionStorage.setItem(NOTIFIED_KEY, '1')
      }
    } catch {}
  }, [])

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY)
      sessionStorage.removeItem(NOTIFIED_KEY)
    } catch {}
  }

  function handleFile(setter, previewSetter) {
    return (file) => {
      if (file === null) { setter(null); previewSetter(null); return }
      if (!file || !file.type.startsWith('image/')) { addToast('Please upload an image file.', 'error'); return }
      setter(file)
      const reader = new FileReader()
      reader.onload = e => previewSetter(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  function getGPS() {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      )
    })
  }

  function validate() {
    const e = {}
    if (!frontImage) e.frontImage = 'Front photo is required'
    if (!finderName.trim()) e.finderName = 'Your name is required'
    if (!finderPhone.trim()) e.finderPhone = 'Phone number is required'
    else if (!/^[0-9+\s\-()]{7,15}$/.test(finderPhone.trim())) e.finderPhone = 'Numbers only'
    if (!finderEmail.trim()) e.finderEmail = 'Email is required — you need this to be notified when owner confirms'
    else if (!/\S+@\S+\.\S+/.test(finderEmail.trim())) e.finderEmail = 'Invalid email address'
    if (!location.trim()) e.location = 'Location is required'
    return e
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    setMatches(null)

    try {
      addToast('Getting your location...', 'info')
      const gpsData = await getGPS()
      setGps(gpsData)

      const frontBase64Full = await compressForStorage(frontImage)
      const backBase64Full = backImage ? await compressForStorage(backImage) : null

      const lostItems = await getLostItems()
      let aiMatches = []

      if (lostItems.length === 0) {
        addToast('No lost reports yet — your find has been logged. The owner will be notified when they report it!', 'info')
      } else {
        const frontBase64AI = await compressForAI(frontImage)
        aiMatches = await analyzeFoundItem(frontBase64AI, 'image/jpeg', lostItems)
      }

      const result = await addFoundItem({
        finderName, finderPhone, finderEmail: finderEmail.trim(),
        location, notes,
        imageUrl: frontBase64Full,
        backImageUrl: backBase64Full,
        matches: aiMatches,
        gps: gpsData,
      })

      setFoundItemId(result.id)
      setFinderReunionId(result.finderReunionId)
      setMatches(aiMatches)
      clearDraft()

      if (aiMatches.length > 0) {
        addToast(`${aiMatches.length} possible match${aiMatches.length > 1 ? 'es' : ''} found! Review and notify the owner.`, 'success')
      } else if (lostItems.length > 0) {
        addToast('Item logged. No matches found yet — owners will be notified if one appears.', 'info')
      }
    } catch (err) {
      console.error('Found item error:', err)
      addToast('Something went wrong. Please try again. Your details are saved.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleNotifyOwner(match) {
    const key = match.lostItemId
    if (!foundItemId) { addToast('Please wait, item is still saving.', 'error'); return }
    setNotifying(prev => ({ ...prev, [key]: true }))
    try {
      await addNotification({
        lostItemId: match.lostItemId,
        ownerEmail: match.ownerEmail,
        ownerName: match.ownerName,
        foundItemId,
        confidence: match.confidence,
        itemName: match.itemName,
      })
      await sendMatchEmail({
        ownerName: match.ownerName,
        ownerEmail: match.ownerEmail,
        itemName: match.itemName,
        confidence: match.confidence,
        reasoning: match.reasoning,
        finderName,
        finderNotes: notes,
        lostItemId: match.lostItemId,
        foundItemId,
        mapLink: `${window.location.origin}/heatmap`,
      })
      setNotifiedMatches(prev => ({ ...prev, [key]: true }))
      addToast(`Owner notified! They'll receive a verification email.`, 'success')
    } catch (err) {
      console.error('Notify error:', err)
      addToast('Failed to notify owner. Try again.', 'error')
    } finally {
      setNotifying(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '6rem 1.5rem 4rem' }}>
      <style>{`
        .found-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 768px) {
          .found-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>Report a Found Item</h1>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>Upload front and back photos so the owner can verify it's theirs. Your GPS will be captured automatically.</p>
        </div>

        <div className="found-grid">
          {/* Left: Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="photo-grid">
              <PhotoZone label="Front Photo" hint="Main face of item" preview={frontPreview} onFile={handleFile(setFrontImage, setFrontPreview)} error={errors.frontImage} fileRef={frontRef} cameraRef={frontCameraRef} required />
              <PhotoZone label="Back Photo" hint="Recommended" preview={backPreview} onFile={handleFile(setBackImage, setBackPreview)} error={null} fileRef={backRef} cameraRef={backCameraRef} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Your Name <span style={{ color: '#ff4d6d' }}>*</span></label>
              <input className="input-base" value={finderName} onChange={e => setFinderName(e.target.value)} placeholder="e.g. Sarah Okonkwo" />
              {errors.finderName && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#ff4d6d', margin: 0 }}>{errors.finderName}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Your Phone Number <span style={{ color: '#ff4d6d' }}>*</span></label>
              <input className="input-base" value={finderPhone} onChange={e => setFinderPhone(e.target.value.replace(/[^0-9+\s\-()]/g, ''))} placeholder="e.g. 08012345678" maxLength={15} />
              {errors.finderPhone && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#ff4d6d', margin: 0 }}>{errors.finderPhone}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Your Email <span style={{ color: '#ff4d6d' }}>*</span></label>
              <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>You'll be notified here when the owner confirms</p>
              <input className="input-base" type="email" value={finderEmail} onChange={e => setFinderEmail(e.target.value)} placeholder="e.g. you@calebuniversity.edu.ng" />
              {errors.finderEmail && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#ff4d6d', margin: 0 }}>{errors.finderEmail}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Where You Found It <span style={{ color: '#ff4d6d' }}>*</span></label>
              <input className="input-base" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. E-Library entrance, Cafeteria, Chapel" />
              {errors.location && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#ff4d6d', margin: 0 }}>{errors.location}</p>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>Additional Notes <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
              <textarea className="input-base" style={{ resize: 'none' }} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any extra details about the item..." />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
              <MapPin size={18} color="var(--muted)" />
              <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>GPS location captured automatically to pin this item on the campus heatmap.</p>
            </div>

            <button className="btn-primary" style={{ justifyContent: 'center', padding: '1rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={handleSubmit} disabled={loading}>
              {loading ? <><LoadingSpinner size="sm" /> Analyzing with AI...</> : <><Search size={18} /> Find the Owner</>}
            </button>
          </div>

          {/* Right: Results */}
          <div>
            {!matches && !loading && (
              <div className="card" style={{ minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center', borderStyle: 'dashed' }}>
                <div style={{ width: 56, height: 56, borderRadius: '1rem', backgroundColor: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={28} color="#6c63ff" />
                </div>
                <div>
                  <p style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>AI Match Results</p>
                  <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)' }}>Upload photos and click "Find the Owner" to see matches here.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="card" style={{ minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
                <LoadingSpinner size="lg" />
                <div>
                  <p style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>AI is analyzing...</p>
                  <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)' }}>Comparing against all lost item reports</p>
                </div>
              </div>
            )}

            {matches && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h3 style={{ fontFamily: 'Space Mono', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {matches.length > 0 ? `${matches.length} Possible Match${matches.length > 1 ? 'es' : ''}` : 'No Matches Found'}
                  </h3>
                  {matches.length > 0 && <p style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: 'var(--muted)' }}>Review each match, then click Notify Owner if you think it's correct.</p>}
                </div>

                {finderReunionId && (
                  <div style={{ padding: '0.875rem 1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)' }}>
                    <p style={{ fontFamily: 'Inter', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 6 }}>YOUR FINDER REUNION ID</p>
                    <span className="reunion-badge reunion-finder">{finderReunionId}</span>
                    <p style={{ fontFamily: 'Inter', fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>Save this! Exchange with owner when you meet to verify each other.</p>
                  </div>
                )}

                {gps && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                    <MapPin size={16} color="#00d4aa" />
                    <p style={{ fontFamily: 'Space Mono', fontSize: '0.72rem', color: '#00d4aa', margin: 0 }}>GPS: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)} — pinned on heatmap</p>
                  </div>
                )}

                {(frontPreview || backPreview) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {frontPreview && <div><p style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 4 }}>FRONT</p><img src={frontPreview} alt="front" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: '0.625rem', border: '1px solid var(--border)' }} /></div>}
                    {backPreview && <div><p style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 4 }}>BACK</p><img src={backPreview} alt="back" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: '0.625rem', border: '1px solid var(--border)' }} /></div>}
                  </div>
                )}

                {matches.length === 0 ? (
                  <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>No matches found. Item logged — owners will be notified if a match appears.</p>
                  </div>
                ) : (
                  matches.sort((a, b) => b.confidence - a.confidence).map((match, i) => (
                    <MatchCard key={i} match={match} onNotify={() => handleNotifyOwner(match)} notified={!!notifiedMatches[match.lostItemId]} notifying={!!notifying[match.lostItemId]} />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}