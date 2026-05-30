import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { addLostItem } from '../services/firestoreService'
import { useToast } from '../components/ToastContext'
import { useTheme } from '../components/ThemeContext'
import LoadingSpinner from '../components/LoadingSpinner'

const categories = ['Phone', 'Laptop', 'Other Electronics', 'Clothing', 'Accessories', 'Books/Notes', 'ID/Cards', 'Keys', 'Bag/Wallet', 'Other']
const today = new Date().toISOString().split('T')[0]
const init = { name: '', email: '', phone: '', itemName: '', category: '', color: '', description: '', location: '', dateLost: '', reward: '', imei: '', photo: '' }

function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
        {label} {required && <span style={{ color: '#ff4d6d' }}>*</span>}
      </label>
      {hint && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{hint}</p>}
      {children}
      {error && <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: '#ff4d6d', margin: 0 }}>{error}</p>}
    </div>
  )
}

export default function ReportLost() {
  const [form, setForm] = useState(init)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const photoRef = useRef()
  const { addToast } = useToast()
  const { dark } = useTheme()

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  function handlePhoto(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => { setPhotoPreview(e.target.result); setForm(f => ({ ...f, photo: e.target.result })) }
    reader.readAsDataURL(file)
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.phone.trim()) e.phone = 'Required'
    else if (!/^[0-9+\s\-()]{7,15}$/.test(form.phone.trim())) e.phone = 'Numbers only'
    if (!form.itemName.trim()) e.itemName = 'Required'
    if (!form.category) e.category = 'Required'
    if (!form.color.trim()) e.color = 'Required'
    if (!form.description.trim()) e.description = 'Required'
    else if (form.description.trim().length < 30) e.description = `Min 30 chars (${form.description.trim().length}/30)`
    if (!form.location.trim()) e.location = 'Required'
    if (!form.dateLost) e.dateLost = 'Required'
    else if (form.dateLost > today) e.dateLost = 'Cannot be a future date'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const result = await addLostItem(form)
      setSubmitted(result)
    } catch (err) {
      addToast('Something went wrong. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1rem 2rem' }}>
        <div className="card animate-fade-up" style={{ padding: '2.5rem', maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text)', marginBottom: 8 }}>Report Submitted!</h2>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)', marginBottom: '1rem' }}>
            We'll email <strong style={{ color: 'var(--text)' }}>{form.email}</strong> the moment AI finds a match.
          </p>
          <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: dark ? 'rgba(108,99,255,0.1)' : 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>YOUR REUNION ID</p>
            <span className="reunion-badge reunion-owner">{submitted.ownerReunionId}</span>
            <p style={{ fontFamily: 'Inter', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
              Save this code! When you meet the finder, exchange codes to verify each other.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/items" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'center' }}>View All Lost Items</Link>
            <Link to="/heatmap" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'center', borderColor: '#00d4aa', color: '#00d4aa' }}>View Campus Heatmap</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: '6rem 1.5rem 4rem' }}>
      <style>{`
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 540px) {
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 999, marginBottom: 16, backgroundColor: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', color: '#6c63ff', fontFamily: 'Inter', fontWeight: 600, fontSize: '0.75rem' }}>
            Caleb University Lost & Found
          </div>
          <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>Report a Lost Item</h1>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>The more detail you provide, the better our AI can match you with a finder.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="two-col">
            <Field label="Your Name" required error={errors.name}>
              <input className="input-base" value={form.name} onChange={set('name')} placeholder="e.g. Victor Ebosetale" />
            </Field>
            <Field label="Your Email" required error={errors.email}>
              <input className="input-base" type="email" value={form.email} onChange={set('email')} placeholder="you@calebuniversity.edu.ng" />
            </Field>
          </div>

          <Field label="Your Phone Number" required error={errors.phone} hint="Finder will use this to contact you">
            <input className="input-base" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/[^0-9+\s\-()]/g, '') }))} placeholder="e.g. 08012345678" maxLength={15} />
          </Field>

          <div className="two-col">
            <Field label="Item Name" required error={errors.itemName}>
              <input className="input-base" value={form.itemName} onChange={set('itemName')} placeholder="e.g. iPhone 13, Casio Calculator" />
            </Field>
            <Field label="Category" required error={errors.category}>
              <select className="input-base" value={form.category} onChange={set('category')} style={{ backgroundColor: 'var(--input-bg)' }}>
                <option value="">Select category...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {['Phone', 'Laptop'].includes(form.category) && (
            <Field label={form.category === 'Phone' ? 'IMEI Number' : 'Serial Number'} hint={form.category === 'Phone' ? 'Dial *#06# to find your IMEI' : 'Check sticker under laptop'}>
              <input className="input-base" value={form.imei} onChange={set('imei')} placeholder={form.category === 'Phone' ? 'e.g. 352099001761481' : 'e.g. PF2NXYZ1'} style={{ fontFamily: 'Space Mono', letterSpacing: '0.05em' }} />
            </Field>
          )}

          <Field label="Color / Appearance" required error={errors.color}>
            <input className="input-base" value={form.color} onChange={set('color')} placeholder="e.g. Matte black with red case" />
          </Field>

          <Field label="Description" required error={errors.description} hint="Be very specific: stickers, scratches, unique marks, contents">
            <div style={{ position: 'relative' }}>
              <textarea className="input-base" style={{ resize: 'none' }} rows={5} value={form.description} onChange={set('description')} placeholder="e.g. Black Casio fx-991ES calculator with a Lagos sticker on the back and a crack on the bottom right corner..." />
              <span style={{ position: 'absolute', bottom: 8, right: 12, fontSize: '0.75rem', fontFamily: 'Space Mono', color: form.description.length < 30 ? '#ff4d6d' : 'var(--muted)' }}>{form.description.length}/30</span>
            </div>
          </Field>

          <div className="two-col">
            <Field label="Where You Lost It" required error={errors.location}>
              <input className="input-base" value={form.location} onChange={set('location')} placeholder="e.g. E-Library, Cafeteria" />
            </Field>
            <Field label="Date Lost" required error={errors.dateLost}>
              <input className="input-base" type="date" value={form.dateLost} onChange={set('dateLost')} max={today} style={{ colorScheme: dark ? 'dark' : 'light' }} />
            </Field>
          </div>

          <Field label="Photo of Item" hint="Optional but recommended — helps AI make better matches">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {photoPreview && <img src={photoPreview} alt="preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: '0.625rem', border: '1px solid var(--border)' }} />}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files[0])} />
                <button type="button" className="btn-ghost" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => photoRef.current.click()}>
                  📷 {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photoPreview && <button type="button" onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo: '' })) }} style={{ background: 'none', border: 'none', color: '#ff4d6d', cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.85rem' }}>Remove</button>}
              </div>
            </div>
          </Field>

          <Field label="Reward Offered" hint="Optional — motivates finders to return the item">
            <input className="input-base" value={form.reward} onChange={set('reward')} placeholder="e.g. ₦2,000 or free jollof rice 😄" />
          </Field>

          <button type="submit" className="btn-primary" style={{ justifyContent: 'center', padding: '1rem', fontSize: '1rem', marginTop: 8 }} disabled={loading}>
            {loading ? <><LoadingSpinner size="sm" /> Submitting...</> : 'Submit Lost Report'}
          </button>
        </form>
      </div>
    </div>
  )
}