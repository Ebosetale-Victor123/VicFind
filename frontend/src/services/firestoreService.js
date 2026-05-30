import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

function generateReunionId(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return `VF-${prefix}-${id}`
}

export async function addLostItem(data) {
  const ownerReunionId = generateReunionId('OWN')
  const docRef = await addDoc(collection(db, 'lostItems'), {
    ...data,
    ownerReunionId,
    createdAt: new Date().toISOString(),
    status: 'active',
  })
  return { id: docRef.id, ownerReunionId }
}

export async function getLostItems() {
  const q = query(collection(db, 'lostItems'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getLostItemById(id) {
  const snap = await getDoc(doc(db, 'lostItems', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function addFoundItem(data) {
  const finderReunionId = generateReunionId('FND')
  const docRef = await addDoc(collection(db, 'foundItems'), {
    ...data,
    finderReunionId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  })
  return { id: docRef.id, finderReunionId }
}

export async function getFoundItems() {
  const q = query(collection(db, 'foundItems'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getFoundItemById(id) {
  const snap = await getDoc(doc(db, 'foundItems', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function markItemReunited(lostItemId, foundItemId) {
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
}

export async function addNotification(data) {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: new Date().toISOString(),
    read: false,
  })
  return docRef.id
}

export async function getNotifications() {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getStats() {
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
}

export async function uploadFoundImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function markItemClaimed(id) {
  await updateDoc(doc(db, 'lostItems', id), { status: 'claimed' })
}

export async function markItemActive(id) {
  await updateDoc(doc(db, 'lostItems', id), { status: 'active' })
}

export async function deleteLostItem(id) { await deleteDoc(doc(db, 'lostItems', id)) }
export async function deleteFoundItem(id) { await deleteDoc(doc(db, 'foundItems', id)) }
export async function deleteNotification(id) { await deleteDoc(doc(db, 'notifications', id)) }

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
}
