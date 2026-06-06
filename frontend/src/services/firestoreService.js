import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

function generateReunionId(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return `VF-${prefix}-${id}`
}

// ---------- resilience helpers ----------

const wait = ms => new Promise(r => setTimeout(r, ms))

// Retry any Firestore operation up to 3 times with backoff — survives flaky/KB-speed networks
async function withRetry(fn, label = 'firestore op', maxRetries = 3) {
  let lastError = null
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      console.warn(`${label} attempt ${attempt} failed:`, err.message)
      if (attempt < maxRetries) await wait(attempt * 1500) // 1.5s, 3s
    }
  }
  throw lastError
}

// Lightweight cache layer: keeps last good fetch in memory + localStorage.
// On a failed/slow fetch, we can fall back to the cached copy so pages still render.
const memCache = {}

function readCache(key) {
  if (memCache[key]) return memCache[key]
  try {
    const saved = localStorage.getItem(`vicfind_cache_${key}`)
    if (saved) { memCache[key] = JSON.parse(saved); return memCache[key] }
  } catch {}
  return null
}

function writeCache(key, value) {
  memCache[key] = value
  try { localStorage.setItem(`vicfind_cache_${key}`, JSON.stringify(value)) } catch {}
}

// ---------- writes (with retry) ----------

export async function addLostItem(data) {
  const ownerReunionId = generateReunionId('OWN')
  const docRef = await withRetry(() => addDoc(collection(db, 'lostItems'), {
    ...data,
    ownerReunionId,
    createdAt: new Date().toISOString(),
    status: 'active',
  }), 'addLostItem')
  return { id: docRef.id, ownerReunionId }
}

export async function addFoundItem(data) {
  const finderReunionId = generateReunionId('FND')
  const docRef = await withRetry(() => addDoc(collection(db, 'foundItems'), {
    ...data,
    finderReunionId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  }), 'addFoundItem')
  return { id: docRef.id, finderReunionId }
}

export async function addNotification(data) {
  const docRef = await withRetry(() => addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: new Date().toISOString(),
    read: false,
  }), 'addNotification')
  return docRef.id
}

export async function markItemReunited(lostItemId, foundItemId) {
  await withRetry(async () => {
    const updates = [
      updateDoc(doc(db, 'lostItems', lostItemId), {
        status: 'reunited',
        reunitedAt: new Date().toISOString(),
      })
    ]
    if (foundItemId) {
      updates.push(updateDoc(doc(db, 'foundItems', foundItemId), {
        status: 'reunited',
        reunitedAt: new Date().toISOString(),
      }))
    }
    await Promise.all(updates)
  }, 'markItemReunited')
}

export async function markItemClaimed(id) {
  await withRetry(() => updateDoc(doc(db, 'lostItems', id), { status: 'claimed' }), 'markItemClaimed')
}

export async function markItemActive(id) {
  await withRetry(() => updateDoc(doc(db, 'lostItems', id), { status: 'active' }), 'markItemActive')
}

// ---------- reads (with retry + cache fallback) ----------

export async function getLostItems() {
  try {
    const items = await withRetry(async () => {
      const q = query(collection(db, 'lostItems'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, 'getLostItems')
    writeCache('lostItems', items)
    return items
  } catch (err) {
    const cached = readCache('lostItems')
    if (cached) { console.warn('getLostItems: using cached data'); return cached }
    throw err
  }
}

export async function getFoundItems() {
  try {
    const items = await withRetry(async () => {
      const q = query(collection(db, 'foundItems'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    }, 'getFoundItems')
    writeCache('foundItems', items)
    return items
  } catch (err) {
    const cached = readCache('foundItems')
    if (cached) { console.warn('getFoundItems: using cached data'); return cached }
    throw err
  }
}

export async function getLostItemById(id) {
  return withRetry(async () => {
    const snap = await getDoc(doc(db, 'lostItems', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  }, 'getLostItemById')
}

export async function getFoundItemById(id) {
  return withRetry(async () => {
    const snap = await getDoc(doc(db, 'foundItems', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  }, 'getFoundItemById')
}

export async function getNotifications() {
  return withRetry(async () => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }, 'getNotifications')
}

export async function getStats() {
  try {
    const stats = await withRetry(async () => {
      const [lostSnap, foundSnap, notifSnap] = await Promise.all([
        getDocs(collection(db, 'lostItems')),
        getDocs(collection(db, 'foundItems')),
        getDocs(collection(db, 'notifications')),
      ])
      const reunited = lostSnap.docs.filter(d => ['reunited', 'claimed'].includes(d.data().status)).length
      return {
        lostCount: lostSnap.docs.filter(d => d.data().status === 'active').length,
        foundCount: foundSnap.size,
        matchCount: notifSnap.size,
        reunitedCount: reunited,
      }
    }, 'getStats')
    writeCache('stats', stats)
    return stats
  } catch (err) {
    const cached = readCache('stats')
    if (cached) { console.warn('getStats: using cached data'); return cached }
    throw err
  }
}

// ---------- misc ----------

export async function uploadFoundImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function deleteLostItem(id) { await withRetry(() => deleteDoc(doc(db, 'lostItems', id)), 'deleteLostItem') }
export async function deleteFoundItem(id) { await withRetry(() => deleteDoc(doc(db, 'foundItems', id)), 'deleteFoundItem') }
export async function deleteNotification(id) { await withRetry(() => deleteDoc(doc(db, 'notifications', id)), 'deleteNotification') }

export async function clearAllData() {
  const [lostSnap, foundSnap, notifSnap] = await Promise.all([
    getDocs(collection(db, 'lostItems')),
    getDocs(collection(db, 'foundItems')),
    getDocs(collection(db, 'notifications')),
  ])
  await Promise.all([
    ...lostSnap.docs.map(d => deleteDoc(doc(db, 'lostItems', d.id))),
    ...foundSnap.docs.map(d => deleteDoc(doc(db, 'foundItems', d.id))),
    ...notifSnap.docs.map(d => deleteDoc(doc(db, 'notifications', d.id))),
  ])
  // clear caches too
  try {
    localStorage.removeItem('vicfind_cache_lostItems')
    localStorage.removeItem('vicfind_cache_foundItems')
    localStorage.removeItem('vicfind_cache_stats')
  } catch {}
}