import { useState, useEffect } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useItems() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchItems() {
      try {
        const q = query(collection(db, 'lostItems'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setItems(all.filter(item => item.status !== 'reunited'))
      } catch (err) {
        console.error('useItems error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [])

  return { items, loading, error }
}
