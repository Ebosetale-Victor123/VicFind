import { useState } from 'react'
import { useItems } from '../hooks/useItems'
import ItemCard from '../components/ItemCard'
import LoadingSpinner from '../components/LoadingSpinner'

const categories = ['All', 'Phone', 'Laptop', 'Other Electronics', 'Clothing', 'Accessories', 'Books/Notes', 'ID/Cards', 'Keys', 'Bag/Wallet', 'Other']

export default function AllLostItems() {
  const { items, loading } = useItems()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = items.filter(item => {
    const s = search.toLowerCase()
    const matchSearch = !search || item.itemName?.toLowerCase().includes(s) || item.description?.toLowerCase().includes(s) || item.category?.toLowerCase().includes(s)
    const matchCat = category === 'All' || item.category === category
    return matchSearch && matchCat
  })

  return (
    <div style={{ minHeight: '100vh', paddingTop: 96, paddingBottom: 64, padding: '7rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em' }}>All Lost Items</h1>
          <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>Browse active lost item reports at Caleb University.</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input className="input-base" style={{ paddingLeft: 44 }} placeholder="Search by item name, description, category..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              fontFamily: 'Inter', fontWeight: 500, fontSize: '0.8rem',
              padding: '0.35rem 0.875rem', borderRadius: 999, cursor: 'pointer', border: '1.5px solid',
              borderColor: category === cat ? '#6c63ff' : 'var(--border)',
              backgroundColor: category === cat ? 'rgba(108,99,255,0.15)' : 'transparent',
              color: category === cat ? '#6c63ff' : 'var(--muted)',
              transition: 'all 0.15s',
            }}>{cat}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 8 }}>
              {search || category !== 'All' ? 'No items match your search' : 'No active lost items'}
            </p>
            <p style={{ fontFamily: 'Inter', color: 'var(--muted)' }}>
              {search || category !== 'All' ? 'Try a different search term.' : 'All items have been reunited — amazing! 🎉'}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: 20 }}>
              Showing <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> active item{filtered.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {filtered.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
