import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore'

// ── FIREBASE ───────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyDF0xPjhjaBqEr0cTWxQt1pw11NDwmw0j0",
  authDomain:        "projeto-casamento-ddca3.firebaseapp.com",
  projectId:         "projeto-casamento-ddca3",
  storageBucket:     "projeto-casamento-ddca3.firebasestorage.app",
  messagingSenderId: "143507242048",
  appId:             "1:143507242048:web:6eafaab4696ae562caf3a5",
  measurementId:     "G-D5Y3DH8Y5T"
}
const firebaseApp = initializeApp(firebaseConfig)
const db = getFirestore(firebaseApp)

// ── DB ─────────────────────────────────────────────────────────────────────
const ITEMS_COL    = 'items'
const SETTINGS_COL = 'settings'
const PASSWORD_DOC = 'auth'
const DEFAULT_PW   = 'Espada123'

async function getPassword() {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, PASSWORD_DOC))
    return snap.exists() ? snap.data().password : DEFAULT_PW
  } catch { return DEFAULT_PW }
}

async function setPassword(pw) {
  await setDoc(doc(db, SETTINGS_COL, PASSWORD_DOC), { password: pw })
}

async function addItem(item) {
  const id = String(Date.now())
  await setDoc(doc(db, ITEMS_COL, id), { ...item, order: Date.now() })
  return id
}

async function updateItem(id, data) {
  await updateDoc(doc(db, ITEMS_COL, id), data)
}

async function deleteItem(id) {
  await deleteDoc(doc(db, ITEMS_COL, id))
}

async function reorderItems(orderedIds) {
  await Promise.all(orderedIds.map((id, index) => updateDoc(doc(db, ITEMS_COL, id), { order: index })))
}

function subscribeItems(callback) {
  const q = query(collection(db, ITEMS_COL), orderBy('order', 'asc'))
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
}

// ── STATE ──────────────────────────────────────────────────────────────────
let items       = []
let filter      = 'todos'
let editId      = null
let loggedIn    = false
let unsubscribe = null
let dragSrcIdx  = null
let dragSrc     = null

renderApp()

async function tryLogin() {
  const pw      = document.getElementById('inp-pw').value
  const correct = await getPassword()
  if (pw === correct) {
    loggedIn = true; renderApp(); startListening()
  } else {
    document.getElementById('login-error').style.display = 'block'
    document.getElementById('inp-pw').value = ''
    document.getElementById('inp-pw').focus()
  }
}

function logout() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null }
  loggedIn = false; items = []; renderApp()
}

function startListening() {
  if (unsubscribe) unsubscribe()
  unsubscribe = subscribeItems(newItems => {
    items = newItems
    render()
  })
}

function renderApp() {
  const app = document.getElementById('app')
  if (!loggedIn) {
    app.innerHTML = `
      <div class="login-wrap">
        <div class="login-card">
          <div class="hearts">♡ ♡ ♡</div>
          <h2>Lista de Casamento</h2>
          <div class="login-fields">
            <div><label>Senha</label><input type="password" id="inp-pw" placeholder="Digite a senha..." autocomplete="current-password" /></div>
            <button class="btn-login" id="btn-entrar">Entrar</button>
          </div>
          <p class="login-error" id="login-error">Senha incorreta. Tente novamente.</p>
        </div>
      </div>`
    document.getElementById('btn-entrar').addEventListener('click', tryLogin)
    document.getElementById('inp-pw').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin() })
  } else {
    app.innerHTML = `
      <div class="topbar">
        <button class="btn-top" id="btn-senha"><i class="ti ti-lock"></i> Senha</button>
        <button class="btn-top" id="btn-sair"><i class="ti ti-logout"></i> Sair</button>
      </div>
      <div class="header">
        <div class="header-hearts">♡ ♡ ♡</div>
        <h1>Lista de Casamento</h1>
        <p>Gerencie os itens para o lar</p>
      </div>
      <div class="tabs">
        <button class="tab active" id="tab-admin-btn"><i class="ti ti-list-check"></i> Gerenciar lista</button>
        <button class="tab" id="tab-guest-btn"><i class="ti ti-gift"></i> Lista de presentes</button>
      </div>
      <div id="tab-admin">
        <div class="stats" id="stats"></div>
        <div class="add-form">
          <h3>Adicionar item</h3>
          <div class="form-col">
            <div class="form-group"><label>Nome do item</label><input type="text" id="inp-nome" placeholder="Ex: Sofá, panelas, TV..." /></div>
            <div class="form-row-2">
              <div class="form-group"><label>Valor (R$)</label><input type="number" id="inp-valor" placeholder="0,00" min="0" step="0.01" inputmode="decimal" /></div>
              <div class="form-group"><label>Prioridade</label>
                <select id="inp-prioridade"><option value="alta">Alta</option><option value="media" selected>Média</option><option value="baixa">Baixa</option></select>
              </div>
            </div>
            <div class="form-group"><label>Categoria</label>
              <select id="inp-categoria"><option>Cozinha</option><option>Sala</option><option>Quarto</option><option>Banheiro</option><option>Eletrodoméstico</option><option>Eletrônico</option><option>Decoração</option><option>Outros</option></select>
            </div>
            <button class="btn-add" id="btn-adicionar">+ Adicionar</button>
          </div>
        </div>
        <div class="filter-bar">
          <button class="filter-btn active" data-filter="todos">Todos</button>
          <button class="filter-btn" data-filter="pendentes">Pendentes</button>
          <button class="filter-btn" data-filter="comprados">Comprados</button>
          <button class="filter-btn" data-filter="alta">Alta prioridade</button>
        </div>
        <div class="item-list" id="item-list"></div>
      </div>
      <div id="tab-guest" style="display:none">
        <div class="guest-header">
          <div style="font-size:26px;margin-bottom:8px">🎁</div>
          <h2>Lista de presentes</h2>
          <p>Itens que ainda precisamos comprar.<br>Qualquer ajuda é muito bem-vinda!</p>
        </div>
        <div id="guest-list" class="guest-list"></div>
        <button class="copy-btn" id="btn-copiar"><i class="ti ti-copy"></i> Copiar lista para compartilhar</button>
      </div>`
    bindEvents(); render()
  }
}

function bindEvents() {
  document.getElementById('btn-senha').addEventListener('click', openChpw)
  document.getElementById('btn-sair').addEventListener('click', logout)
  document.getElementById('btn-adicionar').addEventListener('click', addItemHandler)
  document.getElementById('inp-nome').addEventListener('keydown', e => { if (e.key === 'Enter') addItemHandler() })
  document.getElementById('tab-admin-btn').addEventListener('click', () => switchTab('admin'))
  document.getElementById('tab-guest-btn').addEventListener('click', () => switchTab('guest'))
  document.getElementById('btn-copiar').addEventListener('click', copyList)
  document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter, btn)))
}

function switchTab(t) {
  document.getElementById('tab-admin-btn').classList.toggle('active', t === 'admin')
  document.getElementById('tab-guest-btn').classList.toggle('active', t === 'guest')
  document.getElementById('tab-admin').style.display = t === 'admin' ? '' : 'none'
  document.getElementById('tab-guest').style.display  = t === 'guest' ? '' : 'none'
  if (t === 'guest') renderGuest()
}

function setFilter(f, btn) {
  filter = f
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active'); renderList()
}

async function addItemHandler() {
  const nome = document.getElementById('inp-nome').value.trim()
  if (!nome) { document.getElementById('inp-nome').focus(); return }
  const btn = document.getElementById('btn-adicionar')
  btn.disabled = true; btn.textContent = 'Salvando...'
  try {
    await addItem({ nome, valor: parseFloat(document.getElementById('inp-valor').value) || 0, prioridade: document.getElementById('inp-prioridade').value, categoria: document.getElementById('inp-categoria').value, comprado: false })
    document.getElementById('inp-nome').value = ''; document.getElementById('inp-valor').value = ''
  } finally { btn.disabled = false; btn.textContent = '+ Adicionar' }
}

async function toggleComprado(id) {
  const item = items.find(i => i.id === id)
  if (item) await updateItem(id, { comprado: !item.comprado })
}

async function removeItem(id) {
  if (!confirm('Remover este item?')) return
  await deleteItem(id)
}

function openEdit(id) {
  const item = items.find(i => i.id === id); if (!item) return
  editId = id
  document.getElementById('edit-nome').value       = item.nome
  document.getElementById('edit-valor').value      = item.valor || ''
  document.getElementById('edit-prioridade').value = item.prioridade
  document.getElementById('edit-categoria').value  = item.categoria
  document.getElementById('modal').style.display   = 'flex'
}

async function saveEdit() {
  const item = items.find(i => i.id === editId); if (!item) return
  const btn = document.querySelector('#modal .btn-save')
  btn.disabled = true; btn.textContent = 'Salvando...'
  try {
    await updateItem(editId, { nome: document.getElementById('edit-nome').value.trim() || item.nome, valor: parseFloat(document.getElementById('edit-valor').value) || 0, prioridade: document.getElementById('edit-prioridade').value, categoria: document.getElementById('edit-categoria').value })
    document.getElementById('modal').style.display = 'none'; editId = null
  } finally { btn.disabled = false; btn.textContent = 'Salvar' }
}

function openChpw() { document.getElementById('chpw-modal').style.display = 'flex' }

async function savePassword() {
  const o = document.getElementById('chpw-old').value, n = document.getElementById('chpw-new').value, c = document.getElementById('chpw-confirm').value
  const err = document.getElementById('chpw-error'); err.style.display = 'none'
  const cur = await getPassword()
  if (o !== cur)          { err.textContent = 'Senha atual incorreta.'; err.style.display = 'block'; return }
  if (!n || n.length < 4) { err.textContent = 'A nova senha deve ter ao menos 4 caracteres.'; err.style.display = 'block'; return }
  if (n !== c)            { err.textContent = 'As senhas não coincidem.'; err.style.display = 'block'; return }
  await setPassword(n); closeChpwModal(); alert('Senha alterada com sucesso!')
}

function closeChpwModal() {
  document.getElementById('chpw-modal').style.display = 'none'
  ;['chpw-old','chpw-new','chpw-confirm'].forEach(id => { document.getElementById(id).value = '' })
  document.getElementById('chpw-error').style.display = 'none'
}

function closeModal(e)  { if (!e || e.target === document.getElementById('modal'))      { document.getElementById('modal').style.display = 'none'; editId = null } }
function closeChpw(e)   { if (!e || e.target === document.getElementById('chpw-modal')) closeChpwModal() }
window.closeModal = closeModal; window.saveEdit = saveEdit; window.closeChpw = closeChpw; window.savePassword = savePassword

function fmt(v) { return v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' }

function getFiltered() {
  return items.filter(i => {
    if (filter === 'pendentes') return !i.comprado
    if (filter === 'comprados') return  i.comprado
    if (filter === 'alta')      return  i.prioridade === 'alta' && !i.comprado
    return true
  })
}

function renderStats() {
  const total = items.length, comprados = items.filter(i => i.comprado).length, pendentes = total - comprados
  const valorTotal = items.filter(i => !i.comprado).reduce((s, i) => s + (i.valor || 0), 0)
  document.getElementById('stats').innerHTML = `
    <div class="stat-card"><div class="val">${total}</div><div class="lbl">Total de itens</div></div>
    <div class="stat-card"><div class="val" style="color:#3a5219">${comprados}</div><div class="lbl">Já comprados</div></div>
    <div class="stat-card"><div class="val" style="color:#658c2e">${pendentes}</div><div class="lbl">Pendentes</div></div>
    <div class="stat-card highlight"><div class="val">${valorTotal ? 'R$ ' + valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'R$ 0'}</div><div class="lbl">Falta comprar</div></div>`
}

function renderList() {
  const list = document.getElementById('item-list'), filtered = getFiltered()
  if (!filtered.length) { list.innerHTML = '<div class="empty-state">Nenhum item encontrado.</div>'; return }
  list.innerHTML = filtered.map(item => `
    <div class="item-card ${item.comprado ? 'comprado' : ''}" data-id="${item.id}" draggable="true">
      <div class="drag-handle"><i class="ti ti-grip-vertical"></i></div>
      <div class="item-info">
        <div class="item-name ${item.comprado ? 'comprado' : ''}">${item.nome}</div>
        <div class="item-meta">
          <span class="meta-tag tag-${item.prioridade}">${item.prioridade === 'alta' ? '↑ Alta' : item.prioridade === 'media' ? '→ Média' : '↓ Baixa'}</span>
          <span class="meta-tag tag-cat">${item.categoria}</span>
          ${item.valor ? `<span class="meta-tag tag-valor">${fmt(item.valor)}</span>` : ''}
          ${item.comprado ? '<span class="meta-tag tag-comprado"><i class="ti ti-check" style="font-size:11px"></i> Comprado</span>' : ''}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-check ${item.comprado ? 'done' : ''}" data-action="check" data-id="${item.id}"><i class="ti ti-check"></i></button>
        <button class="btn-edit" data-action="edit" data-id="${item.id}"><i class="ti ti-edit"></i></button>
        <button class="btn-del" data-action="del" data-id="${item.id}"><i class="ti ti-trash"></i></button>
      </div>
    </div>`).join('')
  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation(); const id = btn.dataset.id
      if (btn.dataset.action === 'check') toggleComprado(id)
      if (btn.dataset.action === 'edit')  openEdit(id)
      if (btn.dataset.action === 'del')   removeItem(id)
    })
  })
  bindDrag()
}

function render() { if (!loggedIn) return; renderStats(); renderList() }

function renderGuest() {
  const pendentes = items.filter(i => !i.comprado).sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.prioridade] - { alta: 0, media: 1, baixa: 2 }[b.prioridade]))
  const gl = document.getElementById('guest-list')
  if (!pendentes.length) { gl.innerHTML = '<div class="empty-state">Todos os itens já foram comprados!</div>'; return }
  gl.innerHTML = pendentes.map((item, idx) => `<div class="guest-item"><span class="guest-item-num">${idx + 1}.</span><div class="guest-item-name">${item.nome}</div></div>`).join('')
}

function copyList() {
  const pendentes = items.filter(i => !i.comprado).sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.prioridade] - { alta: 0, media: 1, baixa: 2 }[b.prioridade]))
  if (!pendentes.length) { alert('Não há itens pendentes!'); return }
  let txt = '🎁 Lista de presentes do nosso casamento\n\n'
  pendentes.forEach((item, idx) => { txt += `${idx + 1}. ${item.nome}\n` })
  txt += '\nMuito obrigado pelo carinho! 💕'
  navigator.clipboard.writeText(txt).then(() => alert('Lista copiada!')).catch(() => prompt('Copie:', txt))
}

function bindDrag() {
  document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('dragstart', e => { dragSrc = card; dragSrc.style.opacity = '0.4'; e.dataTransfer.effectAllowed = 'move' })
    card.addEventListener('dragover', e => { e.preventDefault(); document.querySelectorAll('.item-card').forEach(c => c.classList.remove('drag-over')); card.classList.add('drag-over') })
    card.addEventListener('drop', async e => {
      e.preventDefault()
      const srcId = dragSrc.dataset.id, tgtId = card.dataset.id; if (srcId === tgtId) return
      const si = items.findIndex(i => i.id === srcId), ti = items.findIndex(i => i.id === tgtId)
      const moved = items.splice(si, 1)[0]; items.splice(ti, 0, moved)
      renderList(); await reorderItems(items.map(i => i.id))
    })
    card.addEventListener('dragend', () => { document.querySelectorAll('.item-card').forEach(c => { c.classList.remove('drag-over'); c.style.opacity = '' }) })
    const handle = card.querySelector('.drag-handle')
    handle.addEventListener('touchstart', () => { dragSrcIdx = items.findIndex(i => i.id === card.dataset.id); card.style.opacity = '0.5' }, { passive: true })
    handle.addEventListener('touchmove', e => {
      e.preventDefault(); document.querySelectorAll('.item-card').forEach(c => c.classList.remove('drag-over'))
      const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
      if (el) { const c = el.closest('.item-card'); if (c) c.classList.add('drag-over') }
    }, { passive: false })
    handle.addEventListener('touchend', async () => {
      const cards = Array.from(document.querySelectorAll('.item-card')), over = cards.find(c => c.classList.contains('drag-over'))
      if (over && dragSrcIdx !== null) {
        const ti = items.findIndex(i => i.id === over.dataset.id)
        if (ti !== dragSrcIdx) { const moved = items.splice(dragSrcIdx, 1)[0]; items.splice(ti, 0, moved); renderList(); await reorderItems(items.map(i => i.id)) }
      }
      cards.forEach(c => { c.classList.remove('drag-over'); c.style.opacity = '' }); dragSrcIdx = null
    })
  })
}
