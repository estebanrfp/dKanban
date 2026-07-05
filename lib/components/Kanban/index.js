// Browser native ESM requires explicit file paths
import { openModal, closeModal } from '../Modal/index.js'
import drag from '../Drag/index.js'
import alert from '../Alerts/index.js'
import json from './default.js'

// Optional UI sound; lazy-init to avoid 404 until needed
let snd = null
// drag() wires document-level listeners; register them once across remounts
let dragWired = false

export default async function mountKanban ({ db, mount, marked, toast, onLogout, state = {} }) {
  const defaultTemplate = `
    <div id="project-header">
      <h1 id="logo">dKanban</h1>
      <div id="user-info" class="user-info">
        <span id="user-abbr" class="user-abbr"></span>
        <input type="text" id="filter-search" />
      </div>
      <button id="logOut" class="logout-button">X</button>
      <div id="stageBar"></div>
    </div>
    <div id="project">
      <div id="columnsContainer"></div>
      <div id="add-col-div" title="Click to add a new column">+</div>
    </div>`

  let html = ''
  try {
    const response = await fetch('./lib/components/Kanban/template.html')
    if (response.ok) html = await response.text()
  } catch (_) { /* ignore */ }
  mount.innerHTML = html && html.trim() ? html : defaultTemplate

  const notify = typeof toast === 'function' ? toast : (msg, warn) => alert('', '', msg, warn ? 'warning' : 'success', false, true)

  // Identity comes resolved from the boot module (SM + governance watcher)
  const getActive = typeof db?.sm?.getActiveEthAddress === 'function' ? db.sm.getActiveEthAddress.bind(db.sm) : null
  const activeAddress = state.myAddress || (getActive ? getActive() : undefined)
  if (!activeAddress) {
    if (typeof onLogout === 'function') onLogout()
    return () => {}
  }
  const role = state.role || 'guest'
  const canWriteRBAC = !!state.canWrite

  // PERSONAL boards: each identity owns `kanban-board-<address>`, protected by
  // node-level ACLs. A #board=<address> deep link opens someone else's board —
  // editable only if its owner granted you write access.
  const boardOwner = state.boardOwner || activeAddress
  const isMine = boardOwner === activeAddress
  const boardId = `kanban-board-${ boardOwner }`

  // Header: abbreviated address + live role tag (color per trust tier)
  const abbr = addr => addr ? `${ addr.slice(0, 6) }…${ addr.slice(-4) }` : ''
  const abbrEl = document.getElementById('user-abbr')
  if (abbrEl) abbrEl.innerHTML = `${ abbr(activeAddress) } <span class="role-tag role-${ role }">[${ role }]</span>`

  // Board context in the header: whose board is on screen + Share / My board
  const userInfo = document.getElementById('user-info')
  if (userInfo) {
    const ctx = document.createElement('span')
    ctx.id = 'board-context'
    ctx.innerHTML = isMine
      ? '<button id="share-board" title="Share this board with another address">Share</button>'
      : `board of ${ abbr(boardOwner) } <button id="my-board-btn" title="Back to your own board">My board</button>`
    userInfo.insertBefore(ctx, userInfo.firstChild)
  }

  // ---- Live edit capability: RBAC write + ACL ownership/grant on this node.
  // The engine enforces both on every peer; this flag only drives the UI.
  let lastBoardValue = null
  const canEditBoard = () => {
    if (!canWriteRBAC) return false
    if (!lastBoardValue) return isMine // my board, not created yet
    return lastBoardValue.owner === activeAddress ||
      ['write', 'delete'].includes(lastBoardValue.collaborators?.[activeAddress])
  }
  const applyEditGate = () => {
    const project = document.getElementById('project')
    if (project) project.classList.toggle('board-readonly', !canEditBoard())
  }

  // Render tablero default inmediatamente para evitar pantalla vacía — for
  // read-only guests too: they enter the board and watch, with every editing
  // affordance hidden by the gate. The live subscription repaints with the
  // real board as soon as sync delivers it.
  buildRetrievedProject(json)
  updateProgress()
  if (isMine && !canWriteRBAC) {
    notify('Read-only for now — the user role arrives in ~10 s while a superadmin is online', true)
  }
  applyEditGate()

  // reactive board listener
  // Ensure the personal board exists, then subscribe to the target board.
  // The board is created with acls.set — the creator becomes its OWNER and
  // every peer re-checks writes against that ownership (ACL middleware).
  if (isMine && canWriteRBAC) {
    try {
      // Wait-and-retry before creating (dSocial's pattern): a virgin device
      // that boots before sync must NOT clobber the real board by LWW.
      let existing = null
      for (let i = 0; i < 4 && !existing; i++) {
        const res = await db.get(boardId).catch(() => null)
        existing = res?.result?.value ?? null
        if (!existing) await new Promise(r => setTimeout(r, 400))
      }
      if (!existing) {
        await db.sm.acls.set({ type: 'board', id: boardId, owner: activeAddress, ...json }, boardId)
      }
    } catch (e) {
      console.error('Board bootstrap failed:', e)
    }
  }

  const { unsubscribe } = await db.map({ query: { id: boardId, type: 'board' } }, ({ value }) => {
    if (value && value.data && Array.isArray(value.data)) {
      lastBoardValue = value
      buildRetrievedProject(value)
      renderCollaborators()
    }
    applyEditGate()
    updateProgress()
  })

  document.addEventListener('keyup', event => {
    if (event.target.matches('#new-col-title')) {
      const input = document.getElementById('new-col-title')
      const createColBtn = document.getElementById('create-col-btn')
      if (input.value.length > 0) {
        createColBtn.removeAttribute('disabled')
      } else {
        createColBtn.setAttribute('disabled', 'true')
      }
    }
  })

  document.addEventListener('click', event => {
    const btnID = event.target.id
    const elementNumber = getColNumber(btnID)
    let appendEl
    if (event.target.matches('#save-project-name')) {
      saveProjectTitle()
    }
    if (event.target.matches('#edit-project-name')) {
      editProjectTitle()
    }
    if (event.target.matches('.add-card-btn')) {
      openAddCardForm(elementNumber)
    }
    if (event.target.matches('#add-col-div')) {
      const modal = document.getElementById('modal')
      if (!modal.classList.contains('open')) {
        openAddColumn(elementNumber)
      }
    }
    if (event.target.matches('#create-col-btn')) {
      const newColTitle = document.getElementById('new-col-title').value
      const newColTracking = document.getElementById('new-col-tracking').getAttribute('data-tracking')
      addColumn(newColTitle, newColTracking)
    }
    if (event.target.matches('.open-col-menu-btn') || event.target.matches('.open-card-menu-btn')) {
      appendEl = document.getElementById('submenuBody')
      if (!appendEl.hasChildNodes()) {
        openEditSubMenu(event.target, elementNumber)
      }
    }
    if (event.target.matches('#choose-tracking')) {
      openTrackingOptions()
    }
    if (event.target.matches('.optionDiv')) {
      const chosenValue = event.target.children[0].value
      const chosenText = event.target.children[0].getAttribute('data-text')
      assignNewColTracking(chosenValue, chosenText)
    }
    if (event.target.matches(`#update-col-${ elementNumber }`)) {
      updateColumnTitle(elementNumber)
    }
    if (event.target.matches('.delete-col-btn')) {
      deleteColumn(elementNumber)
    }
    if (event.target.matches('.update-card-btn')) {
      updateCardText(elementNumber)
    }
    if (event.target.matches('.col-tool')) {
      if (event.target.id === `open-edit-col-${ elementNumber }`) {
        openColEdit(elementNumber)
      }
      if (event.target.id === `delete-col-${ elementNumber }`) {
        openDeleteWarning(elementNumber)
      }
    }
    if (event.target.matches('.card-tool')) {
      if (event.target.id === `open-edit-card-${ elementNumber }`) {
        openCardEdit(elementNumber)
      }
      if (event.target.id === `delete-card-${ elementNumber }`) {
        deleteCard(elementNumber)
      }
    }
    if (event.target.matches('#close-modal') || event.target.matches('#cancel-modal-action')) {
      closeModal()
    }
    if (event.target.matches('#close-col-menu')) {
      closeSubMenu()
    }
    if (event.target.matches(`#add-card-${ elementNumber }`)) {
      addCard(elementNumber)
    }
    if (event.target.matches(`#remove-add-card-form-${ elementNumber }`)) {
      closeAddCardForm(elementNumber)
    }
    if (event.target.matches('#share-board')) {
      openShareModal()
    }
    if (event.target.matches('#grant-access-btn')) {
      grantAccess()
    }
    if (event.target.matches('.revoke-access-btn')) {
      revokeAccess(event.target.getAttribute('data-address'))
    }
    if (event.target.matches('#copy-share-link')) {
      navigator.clipboard.writeText(shareLink()).then(
        () => notify('Board link copied — send it to your collaborator'),
        () => notify('Could not copy the link', true)
      )
    }
    if (event.target.matches('#my-board-btn')) {
      location.hash = '' // hashchange remounts on the own board
    }
  })

  function updateProgress () {
    const stageBar = document.getElementById('stageBar')
    const allCards = document.getElementsByClassName('card')
    const doneCards = document.querySelectorAll('.card[data-card-track="done"]')
    const inProgressCards = document.querySelectorAll('.card[data-card-track="in-progress"]')
    const cardContainers = document.getElementsByClassName('cardsContainer')
    const totals = document.getElementsByClassName('total')
    const doneBar = document.createElement('div')
    const inProgressBar = document.createElement('div')

    if (!stageBar) return
    while (stageBar.hasChildNodes()) {
      stageBar.removeChild(stageBar.firstChild)
    }
    for (let h = 0; h < cardContainers.length; h++) {
      const cardCount = cardContainers[h].querySelectorAll('.card').length
      totals[h].innerText = cardCount
    }
    doneBar.classList.add('done-gradient')
    inProgressBar.classList.add('in-progress-gradient')

    const unit = allCards.length > 0 ? (200 / allCards.length) : 0
    doneBar.style.width = `${ unit * doneCards.length }px`
    inProgressBar.style.width = `${ unit * inProgressCards.length }px`

    stageBar.appendChild(doneBar)
    stageBar.appendChild(inProgressBar)
    if (snd === null) {
      try { snd = new Audio('./update.mp3') } catch (_) { snd = undefined }
    }
    if (snd && typeof snd.play === 'function') {
      try { snd.play() } catch (_) {}
    }
  }

  async function updateProjectData () {
    // UI gate — the real enforcement is the ACL middleware on every peer.
    if (!canEditBoard()) {
      notify('Read-only board — only the owner (or a granted collaborator) can edit it', true)
      return
    }
    const allCols = document.getElementsByClassName('col')
    const projectData = []
    for (let i = 0; i < allCols.length; i++) {
      const cardData = []
      const cards = allCols[i].querySelectorAll('.card')
      const colNumber = getColNumber(allCols[i].id)
      const colTitle = allCols[i].querySelector('.col-name').innerText
      const colTracking = allCols[i].getAttribute('data-track')

      for (let k = 0; k < cards.length; k++) {
        const cardNumber = getColNumber(cards[k].id)
        const cardText = cards[k].getAttribute('data-card-md')
        const cardBg = cards[k].getAttribute('data-card-bg')
        const card = new Card(cardNumber, cardText, cardBg)
        cardData.push(card)
      }
      const col = new Column(colNumber, colTitle, colTracking, cardData)
      projectData.push(col)
    }

    const update = new Project(projectData.title || 'none', projectData, allCols.length)
    localStorage.setItem('projectStore', JSON.stringify(update))
    // persist full board on every structural change — via acls.set so the
    // node stays ACL-protected; owner/collaborators metadata is preserved.
    try {
      const meta = lastBoardValue
        ? { type: 'board', id: boardId, owner: lastBoardValue.owner, ...(lastBoardValue.collaborators ? { collaborators: lastBoardValue.collaborators } : {}) }
        : { type: 'board', id: boardId, owner: activeAddress }
      await db.sm.acls.set({ ...meta, ...update }, boardId)
    } catch (e) {
      console.error('Failed to persist board:', e)
      notify(e?.message || 'The network rejected this change (no write access)', true)
    }
  }

  if (!dragWired) {
    drag(updateProjectData)
    dragWired = true
  }

  // =========================== Share Access (ACLs) ==========================
  // The owner grants write on THIS board node to another address, then mirrors
  // the grant into the node value so every peer's UI can show edit affordances
  // without an async ACL lookup (same pattern as dProp).

  const shareLink = () => `${ location.origin }${ location.pathname }#board=${ boardOwner }`

  function openShareModal () {
    const modalBody = document.getElementById('modalBody')
    const modalTitle = document.getElementById('modalTitle')
    modalTitle.innerText = 'Share this board'
    modalBody.innerHTML = `
      <p>Grant <strong>write</strong> access to another identity. They open your board with this link:</p>
      <p class="share-link-row"><code>${ shareLink() }</code></p>
      <button id="copy-share-link" class="confirm-btn">Copy link</button>
      <input id="share-address" type="text" placeholder="0x… address of your collaborator" />
      <button id="grant-access-btn" class="confirm-btn">Grant write access</button>
      <div id="collab-list"></div>
    `
    openModal()
    renderCollaborators()
  }

  function renderCollaborators () {
    const list = document.getElementById('collab-list')
    if (!list) return
    const collaborators = Object.entries(lastBoardValue?.collaborators || {})
    list.innerHTML = collaborators.length
      ? collaborators.map(([addr, perm]) =>
        `<div class="collab-row"><code>${ abbr(addr) }</code> <span>${ perm }</span>
           <button class="revoke-access-btn" data-address="${ addr }">Revoke</button></div>`).join('')
      : '<p class="collab-empty">Not shared with anyone yet.</p>'
  }

  async function grantAccess () {
    const input = document.getElementById('share-address')
    const addr = input?.value.trim()
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr || '')) return notify('Enter a valid Ethereum address (0x…)', true)
    if (addr === activeAddress) return notify('That is your own address', true)
    try {
      // 1. The real permission: grant write on this node via GenosDB ACLs.
      await db.sm.acls.grant(boardId, addr, 'write')
      // 2. Mirror the grant into the node value for every peer's UI.
      const { result: node } = await db.get(boardId)
      const collaborators = { ...(node.value.collaborators || {}), [addr]: 'write' }
      await db.sm.acls.set({ ...node.value, collaborators }, boardId)
      input.value = ''
      notify(`Write access granted to ${ abbr(addr) }`)
    } catch (e) {
      notify(e?.message || 'Error granting access — only the owner can share', true)
    }
  }

  async function revokeAccess (addr) {
    try {
      await db.sm.acls.revoke(boardId, addr)
      const { result: node } = await db.get(boardId)
      const collaborators = { ...(node.value.collaborators || {}) }
      delete collaborators[addr]
      await db.sm.acls.set({ ...node.value, collaborators }, boardId)
      notify(`Access revoked for ${ abbr(addr) }`)
    } catch (e) {
      notify(e?.message || 'Error revoking access', true)
    }
  }

  function buildRetrievedProject (data) {
    const projectData = data // JSON.parse(localStorage.getItem('projectStore'));
    let colContainer = document.getElementById('columnsContainer')
    if (!colContainer) {
      // Inyectar fallback si el template no cargó
      mount.innerHTML = defaultTemplate
      colContainer = document.getElementById('columnsContainer')
      if (!colContainer) return
    }
    const columns = document.getElementsByClassName('col')
    while (columns.length > 0) {
      columns[0].parentNode.removeChild(columns[0])
    }

    const projectHTML = `${ projectData.data.map((col, i) =>
      `<div id="stage-${ col.colNumber }" class="col ${ col.tracking }-gradient ${ col.tracking }-border" data-track="${ col.tracking }" draggable="true">
          <div class="colHeader">
            <div id="total-${ col.colNumber }" class="total ${ col.tracking }-border"></div><h2 class="col-name">${ col.colTitle }</h2>
            <button id="addCard-${ col.colNumber }" class="add-card-btn col-btn" title="Add a card to this column">
              <svg class="octicon octicon-plus" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z"></path></svg>
            </button>
            <button id="open-col-menu-${ col.colNumber }" class="open-col-menu-btn col-btn" title="Open column edit menu">
              <svg class="octicon octicon-kebab-horizontal" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg>
            </button>
          </div>
          <div id="cards-${ col.colNumber }" class="cardsContainer" data-track="${ col.tracking }">
            ${ col.cards.map((card, i) =>
        `<div id="card-${ card.cardNumber }" class="card" draggable="true" data-card-track="${ col.tracking }" data-card-md="${ card.cardText }" data-card-bg="${ card.cardBg }" style="background:${ card.cardBg }">
          <button id="open-card-menu-${ card.cardNumber }" class="open-card-menu-btn card-btn" title="Open card edit menu">
            <svg class="octicon octicon-kebab-horizontal" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg>
          </button>
          <div id="card-text-${ card.cardNumber }" class="card-text">${ marked(card.cardText) }</div>
        </div>`
      ).join('') }
          </div>
        </div>`
    ).join('') }`
    colContainer.insertAdjacentHTML('afterbegin', projectHTML)
  }
  function Project (title, data, runningColCount) {
    this.title = title
    this.data = data
    this.runningColCount = runningColCount
  }
  function Column (colNumber, colTitle, colTracking, cards) {
    this.colNumber = colNumber
    this.colTitle = colTitle
    this.tracking = colTracking
    this.cards = cards
  }
  function Card (cardNumber, cardText, cardBg) {
    this.cardNumber = cardNumber
    this.cardText = cardText
    this.cardBg = cardBg
  }
  function getColNumber (str) {
    const slicedStr = str.slice(str.lastIndexOf('-') + 1)
    return slicedStr
  }
  function openEditSubMenu (btn, elementNumber) {
    const submenu = document.getElementById('sub-menu')
    const submenuBody = document.getElementById('submenuBody')
    const editOptionsHTML = `
      <ul>
        <li>
          <a id="open-edit-${ btn.classList.contains('col-btn') ? 'col' : 'card' }-${ elementNumber }" class="${ btn.classList.contains('col-btn') ? 'col' : 'card' }-tool">Edit ${ btn.classList.contains('col-btn') ? 'column' : 'card' }</a>
        </li>
      </ul>
      <ul>
        <li>
          <a id="delete-${ btn.classList.contains('col-btn') ? 'col' : 'card' }-${ elementNumber }" class="${ btn.classList.contains('col-btn') ? 'col' : 'card' }-tool">Delete ${ btn.classList.contains('col-btn') ? 'column' : 'card' }</a>
        </li>
      </ul>
    `
    submenuBody.innerHTML = editOptionsHTML
    submenu.removeAttribute('hidden')
    const submenuPosX = btn.offsetLeft - (submenu.offsetWidth * 0.9) + 15
    const submenuPosY = btn.offsetTop + 30
    submenu.style.left = `${ submenuPosX }px`
    submenu.style.top = `${ submenuPosY }px`
    submenu.style.display = 'block'
  }

  function openTrackingOptions () {
    const buttonPressed = document.getElementById('choose-tracking')
    const modal = document.getElementById('modal')
    const submenu = document.getElementById('sub-menu')
    const menuHead = document.getElementById('submenuHeader')
    const menuTitle = document.getElementById('submenuTitle')
    const menuBody = document.getElementById('submenuBody')
    const newColTracking = document.getElementById('new-col-tracking').getAttribute('data-tracking')
    const trackingOptions = [
      { optionTitle: 'None', optionText: 'This column will not be automated', dataTracking: 'none' },
      { optionTitle: 'To do', optionText: 'Planned but not started', dataTracking: 'to-do' },
      { optionTitle: 'In progress', optionText: 'Actively being worked on', dataTracking: 'in-progress' },
      { optionTitle: 'Done', optionText: 'Items are complete', dataTracking: 'done' },
      { optionTitle: 'Trash', optionText: 'Items are discarted', dataTracking: 'trash' }
    ]
    menuTitle.innerText = 'Select type'
    if (menuBody.childElementCount === 0) {
      const optionsHTML = `${ trackingOptions.map((item, i) =>
        `<div class="optionDiv">
          <input id="track-option-${ i + 1 }" type="radio" name="new-tracking-type" class="tracking-type" value="${ item.dataTracking }" hidden="tru" data-text="${ item.optionTitle }" />
          <div class="checkDiv">
            <span class="trackingCheck">${ item.dataTracking === newColTracking ? '&#10003;' : '' }</span>
            <label for="track-option-${ i + 1 }">${ item.optionTitle }</label>
          </div>
          <span class="trackingDesc">${ item.optionText }</span>
        </div>`
      ).join('') }`
      menuBody.innerHTML = optionsHTML
    }
    menuHead.removeAttribute('hidden')
    submenu.removeAttribute('hidden')
    submenu.style.width = 'auto'

    const submenuPosX = ((window.innerWidth / 2) - (modal.offsetWidth / 2) + 16)
    const submenuPosY = (window.innerHeight / 4) + buttonPressed.offsetTop + buttonPressed.offsetHeight

    submenu.style.left = `${ submenuPosX }px`
    submenu.style.top = `${ submenuPosY }px`
    submenu.style.display = 'block'
  }
  function assignNewColTracking (value, text) {
    const newColTracking = document.getElementById('new-col-tracking')
    newColTracking.setAttribute('data-tracking', value)
    newColTracking.innerText = text
    closeSubMenu()
  }
  function updateColumnTitle (column) {
    const colTitle = document.querySelector(`#stage-${ column } .col-name`)
    const newColTitle = document.getElementById(`update-col-text-${ column }`).value
    colTitle.innerText = newColTitle
    updateProjectData()
    closeModal()
  }
  function deleteColumn (column) {
    const columnsContainer = document.getElementById('columnsContainer')
    const stageColumn = document.getElementById(`stage-${ column }`)
    columnsContainer.removeChild(stageColumn)
    closeModal()
    updateProjectData()
  }
  function closeSubMenu () {
    const submenu = document.getElementById('sub-menu')
    const submenuBody = document.getElementById('submenuBody')
    const menuTitle = document.getElementById('submenuTitle')
    menuTitle.innerText = ''
    submenu.setAttribute('hidden', 'true')
    submenu.removeAttribute('style')
    while (submenuBody.hasChildNodes()) {
      submenuBody.removeChild(submenuBody.firstChild)
    }
  }
  function openAddColumn (column) {
    const modalBody = document.getElementById('modalBody')
    const modalTitle = document.getElementById('modalTitle')
    const modalBodyHTML = `
      <input id="new-col-title" placeholder="Column name (To do, In Progress, Done)" />
      <button id="choose-tracking">
        <span>Preset: </span><span id="new-col-tracking" data-tracking="none">None</span>
      </button>
      <br>
      <button disabled="true" id="create-col-btn" class="confirm-btn">Create column</button>
   `
    modalTitle.innerText = 'Add a Column'
    modalBody.innerHTML = modalBodyHTML
    openModal()
  }
  function addColumn (newColTitle, newColTracking) {
    const projectStore = JSON.parse(localStorage.getItem('projectStore'))
    const addColDiv = document.getElementById('add-col-div')
    const newColNumber = parseInt(projectStore.runningColCount) + 1
    const columnHTML = `
    <div id="stage-${ newColNumber }" class="col ${ newColTracking }-gradient ${ newColTracking }-border" data-track="${ newColTracking }" draggable="true">
      <div class="colHeader">
        <div id="total-${ newColNumber }" class="total ${ newColTracking }-border">0</div><h2 class="col-name">${ newColTitle }</h2>
        <button id="addCard-${ newColNumber }" class="add-card-btn col-btn" title="Add a card to this column">
          <img src="https://res.cloudinary.com/anthony-dee/image/upload/v1546548847/noun_Plus_869750_no_attribute.svg" alt="Add a card to this column" />
        </button>
        <button id="open-col-menu-${ newColNumber }" class="open-col-menu-btn col-btn" title="Open column edit menu">
          <img src="https://res.cloudinary.com/anthony-dee/image/upload/v1546548847/noun_ellipsis_869758_no_attribute.svg" alt="Open column edit menu" />
        </button>
      </div>
      <div id="cards-${ newColNumber }" class="cardsContainer" data-track="${ newColTracking }">
      </div>
    </div>
    `
    addColDiv.insertAdjacentHTML('beforebegin', columnHTML)
    closeModal()
    const update = new Project(projectStore.title, projectStore.data, newColNumber)
    localStorage.setItem('projectStore', JSON.stringify(update))

    updateProjectData()
  }
  function openDeleteWarning (column) {
    const colName = document.querySelector(`#stage-${ column } .col-name`).innerText
    const modalBody = document.getElementById('modalBody')
    const modalTitle = document.getElementById('modalTitle')
    const modalBodyHTML = `
      <p>This action will remove any cards and automation preset associated with the column.</p>
      <button id="delete-col-${ column }" class="delete-col-btn">Delete column</button><button id="cancel-modal-action">Cancel</button>
    `
    modalTitle.innerText = `Delete ${ colName }`
    modalBody.innerHTML = modalBodyHTML
    closeSubMenu()
    openModal()
  }
  function openColEdit (column) {
    const colName = document.querySelector(`#stage-${ column } .col-name`).innerText
    const modalTitle = document.getElementById('modalTitle')
    const modalBody = document.getElementById('modalBody')
    const modalBodyHTML = `
      <input id="update-col-text-${ column }" type="text" placeholder="Enter a column name (To Do, In Progress, Done)" value="${ colName }"/>
      <button id="update-col-${ column }" class="confirm-btn">Update column</button></div>
    `
    modalTitle.innerText = `Edit ${ colName }`
    modalBody.innerHTML = modalBodyHTML
    const updateColText = document.getElementById(`update-col-text-${ column }`)
    closeSubMenu()
    openModal()
    updateColText.focus()
  }
  function openCardEdit (card) {
    const cardText = document.getElementById(`card-${ card }`).getAttribute('data-card-md')
    const modalBody = document.getElementById('modalBody')
    const modalTitle = document.getElementById('modalTitle')
    // editar
    const modalBodyHTML = `
      <textarea id="update-card-text-${ card }" rows="6" cols="20">${ cardText }</textarea>
      <button id="update-card-${ card }" class="update-card-btn confirm-btn">Save</button>
    `
    modalTitle.innerText = 'Edit card'
    modalBody.innerHTML = modalBodyHTML
    const updateCardText = document.getElementById(`update-card-text-${ card }`)
    closeSubMenu()
    openModal()
    updateCardText.focus()
  }
  function updateCardText (card) {
    const mdCardText = document.getElementById(`card-${ card }`)
    const thisCardText = document.getElementById(`card-text-${ card }`)
    const cardText = document.getElementById(`update-card-text-${ card }`).value

    thisCardText.innerText = cardText
    mdCardText.setAttribute('data-card-md', cardText)

    updateProjectData()
    closeModal()
  }
  function deleteCard (card) {
    const deleteConfirm = confirm('This will remove this card from the project')
    const cardToDelete = document.getElementById(`card-${ card }`)
    if (deleteConfirm) {
      cardToDelete.parentNode.removeChild(cardToDelete)
      closeSubMenu()

      updateProjectData()
    } else {
      // Do nothing
    }
  }

  function openAddCardForm (column) {
    const cardContainer = document.getElementById(`cards-${ column }`)
    const addCardTemplate = `
      <div id="add-card-div-${ column }" class="add-card-box">
        <ul class="color-list">
          <li class="color" data-color="#fbe983"></li>
          <li class="color" data-color="#fffacd"></li>
          <li class="color" data-color="#c6defb"></li>
          <li class="color" data-color="#d3fda2"></li>
          <li class="color" data-color="#7fffd4"></li>
          <li class="color" data-color="#ffb6c1"></li>
          <li class="color" data-color="#a5eeed"></li>
          <li class="color" data-color="#59ceda"></li>
          <li class="color" data-color="#0ff"></li>
        </ul>
        <form>
          <textarea id="new-card-text-${ column }" class="new-card-text" placeholder="# title" rows="3"></textarea>
          <button id="add-card-${ column }" class="confirm-btn flex-btn-left" type="button">Add</button>
          <button type="button" id="remove-add-card-form-${ column }" class="flex-btn-right">Cancel</button>
        </form>
      </div>
    `
    if (!cardContainer.querySelector('.add-card-box')) {
      cardContainer.insertAdjacentHTML('afterbegin', addCardTemplate)
    }
    const colors = cardContainer.querySelectorAll('.color-list .color')
    colors.forEach(el => {
      el.style.backgroundColor = el.getAttribute('data-color')
      el.onclick = e => {
        el.parentElement.parentElement.setAttribute('data-bg', el.getAttribute('data-color'))
        el.parentElement.parentElement.querySelector('form textarea').style.backgroundColor = el.getAttribute('data-color')
      }
    })
  }
  function addCard (column) {
    const colTracking = document.getElementById(`stage-${ column }`).getAttribute('data-track')
    const bgColor = document.getElementById(`add-card-div-${ column }`).getAttribute('data-bg')
    const textarea = document.getElementById(`new-card-text-${ column }`)
    const newNoteText = textarea.value
    const allCards = document.querySelectorAll('.card')
    const newCardNo = allCards.length + 1
    const addCardDiv = document.getElementById(`add-card-div-${ column }`)
    const cardTemplate = `
      <div id="card-${ newCardNo }" class="card" draggable="true" data-card-track="${ colTracking }" data-card-bg="${ bgColor }" data-card-md="${ newNoteText }" style="background:${ bgColor };">
        <div id="card-text-${ newCardNo }" class="card-text">${ marked(newNoteText) }</div>
        <button id="open-card-menu-${ newCardNo }" class="open-card-menu-btn card-btn" title="Open card edit menu">
          <svg class="octicon octicon-kebab-horizontal" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM1.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm13 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path></svg>
        </button>
      </div>
    `
    if (newNoteText === '') {
      alert('', '', 'Please enter a card description', 'success', false, true)
    } else {
      textarea.value = ''
      addCardDiv.insertAdjacentHTML('afterend', cardTemplate)

      updateProjectData()
    }
  }
  function closeAddCardForm (column) {
    const addBtnDiv = document.getElementById(`add-card-div-${ column }`)
    const cardContainer = document.getElementById(`cards-${ column }`)
    cardContainer.removeChild(addBtnDiv)
  }

  async function logout () {
    try {
      if (unsubscribe) unsubscribe()
    } finally {
      // The security callback in the boot module unmounts and reopens the door.
      if (typeof onLogout === 'function') onLogout()
    }
  }

  const logoutBtn = document.getElementById('logOut')
  if (logoutBtn) logoutBtn.addEventListener('click', logout)

  // search (guard if element not present)
  const filterSearch = document.getElementById('filter-search')
  if (filterSearch) filterSearch.addEventListener('keyup', e => {
    const filterRegex = new RegExp(`\\b${ e.target.value }`, 'gi')

    document.querySelectorAll('[data-card-md]').forEach(item => {
      item.classList.toggle('search-hide', !item.innerText.match(filterRegex))
    })
  })

  // cleanup used by the boot module on logout / role change / board switch
  return () => {
    if (logoutBtn) logoutBtn.removeEventListener('click', logout)
    if (unsubscribe) unsubscribe()
  }
}
