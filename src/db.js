import { db } from './firebase.js'
import {
  collection, doc,
  getDocs, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy,
  getDoc
} from 'firebase/firestore'

const ITEMS_COL    = 'items'
const SETTINGS_COL = 'settings'
const PASSWORD_DOC = 'auth'
const DEFAULT_PW   = 'Espada123'

// ── SENHA ──────────────────────────────────────────────────────────────────

export async function getPassword() {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, PASSWORD_DOC))
    return snap.exists() ? snap.data().password : DEFAULT_PW
  } catch {
    return DEFAULT_PW
  }
}

export async function setPassword(pw) {
  await setDoc(doc(db, SETTINGS_COL, PASSWORD_DOC), { password: pw })
}

// ── ITENS ──────────────────────────────────────────────────────────────────

export async function getItems() {
  const q = query(collection(db, ITEMS_COL), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function addItem(item) {
  // usa Date.now() como id para manter ordem de inserção
  const id = String(Date.now())
  await setDoc(doc(db, ITEMS_COL, id), { ...item, order: Date.now() })
  return id
}

export async function updateItem(id, data) {
  await updateDoc(doc(db, ITEMS_COL, id), data)
}

export async function deleteItem(id) {
  await deleteDoc(doc(db, ITEMS_COL, id))
}

export async function reorderItems(orderedIds) {
  const promises = orderedIds.map((id, index) =>
    updateDoc(doc(db, ITEMS_COL, id), { order: index })
  )
  await Promise.all(promises)
}

// ── REALTIME (listener para sync entre dispositivos) ───────────────────────

export function subscribeItems(callback) {
  const q = query(collection(db, ITEMS_COL), orderBy('order', 'asc'))
  return onSnapshot(q, snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(items)
  })
}
