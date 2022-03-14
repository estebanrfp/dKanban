import { marked } from 'marked'

import { updateTask } from '../crud'
import { openModal, closeModal } from '../Modal'
import drag from '../Drag'
// import todo from '../Todo'
import alert from '../Alerts'
import html from './template.html?raw'
import json from './default.js'

import { gun, user, SEA } from '../../Gun'

import './styles.css'
import './colorPicker.css'

const snd = new Audio('./update.mp3')

function Kanban () {
  document.querySelector('.Layout').innerHTML = html

  const keys = JSON.parse(window.localStorage.getItem('keys'))

  const db = gun.get('dkanban').get('boards')

  async function checkFirstBoard () {
    const enc = await db.get(keys.pub).then()
    if (!enc) {
      buildRetrievedProject(json)
      updateProgress()
    }
  }
  checkFirstBoard()

  db.get(keys.pub).on(async (enc, key) => {
    const dec = await SEA.decrypt(enc, keys)
    buildRetrievedProject(dec)
    updateProgress()
  })

  // db.map().on(async (encriptedNode, hash) => {
  //   const node = await SEA.decrypt(encriptedNode, keys)
  //   if (node) {
  //     // alert(JSON.stringify(node.data))
  //     // if (node.data !== '') {
  //     //   printProjectTitle(node.title)
  //     // }
  //     // if (node.title !== '') {
  //     //   printProjectTitle(node.title)
  //     // }
  //     // projectDataAvailable = false
  //     buildRetrievedProject(node)
  //     updateProgress()
  //   }
  // })

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

    while (stageBar.hasChildNodes()) {
      stageBar.removeChild(stageBar.firstChild)
    }
    for (let h = 0; h < cardContainers.length; h++) {
      const cardCount = cardContainers[h].querySelectorAll('.card').length
      totals[h].innerText = cardCount
    }
    doneBar.classList.add('done-gradient')
    inProgressBar.classList.add('in-progress-gradient')

    doneBar.style.width = `${ (200 / allCards.length) * doneCards.length }px`
    inProgressBar.style.width = `${ (200 / allCards.length) * inProgressCards.length }px`

    // doneBar.style.width = ((100*allCards.length) * doneCards.length) + 'px';
    // inProgressBar.style.width = ((100*allCards.length) * inProgressCards.length) + 'px';

    stageBar.appendChild(doneBar)
    stageBar.appendChild(inProgressBar)
    snd.play()
  }

  function updateProjectData () {
    const allCols = document.getElementsByClassName('col')
    // let projectStore
    // if (projectDataAvailable) {
    //   projectStore = JSON.parse(localStorage.getItem('projectStore'))
    // }
    const projectData = []
    for (let i = 0; i < allCols.length; i++) {
      const cardData = []
      const cards = allCols[i].querySelectorAll('.card')
      const colNumber = getColNumber(allCols[i].id)
      const colTitle = allCols[i].querySelector('.col-name').innerText
      const colTracking = allCols[i].getAttribute('data-track')

      for (let k = 0; k < cards.length; k++) {
        const cardNumber = getColNumber(cards[k].id)
        // const cardText = cards[k].querySelector(`#card-text-${ cardNumber }`).innerText
        const cardText = cards[k].getAttribute('data-card-md')
        const cardBg = cards[k].getAttribute('data-card-bg')
        const card = new Card(cardNumber, cardText, cardBg)
        cardData.push(card)
      }
      const col = new Column(colNumber, colTitle, colTracking, cardData)
      projectData.push(col)
    }
    // if (projectDataAvailable) {
    //   // console.log(projectStore)
    //   update = new Project(projectStore.title, projectData, projectStore.runningColCount)
    // } else {
    //   update = new Project('', projectData, allCols.length)
    // }

    const update = new Project(projectData.title || 'none', projectData, allCols.length)
    localStorage.setItem('projectStore', JSON.stringify(update))
    // console.log(JSON.stringify(update))
    updateTask(JSON.stringify(update), 'board')
  }

  drag(updateProjectData)

  function buildRetrievedProject (data) {
    const projectData = data // JSON.parse(localStorage.getItem('projectStore'));
    const colContainer = document.getElementById('columnsContainer')
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
  // function saveProjectTitle () {
  //   const projectStore = JSON.parse(localStorage.getItem('projectStore'))
  //   const projectTitle = document.getElementById('project-title-text').value
  //   let update
  //   if (projectTitle === '') {
  //     alert('', '', 'Please enter a project title', 'success', false, true)
  //   } else {
  //     update = new Project(projectTitle, projectStore.data)
  //     localStorage.setItem('projectStore', JSON.stringify(update))
  //     printProjectTitle(projectTitle)
  //   }
  // }
  // function editProjectTitle () {
  //   const titleInput = document.getElementById('project-title-text')
  //   const saveTitleBtn = document.getElementById('save-project-name')
  //   const titleH2 = document.getElementById('project-title')
  //   const editTitleBtn = document.getElementById('edit-project-name')
  //   titleH2.setAttribute('hidden', true)
  //   editTitleBtn.setAttribute('hidden', true)
  //   titleInput.removeAttribute('hidden')
  //   saveTitleBtn.removeAttribute('hidden')
  //   titleInput.value = localStorage.getItem('projectTitle')
  //   titleInput.focus()
  // }
  // function printProjectTitle (title) {
  //   // const titleInput = document.getElementById('project-title-text')
  //   // const saveTitleBtn = document.getElementById('save-project-name')
  //   // const titleH2 = document.getElementById('project-title')
  //   // const editTitleBtn = document.getElementById('edit-project-name')
  //   // titleInput.setAttribute('hidden', true)
  //   // saveTitleBtn.setAttribute('hidden', true)
  //   // titleH2.innerText = title
  //   // titleH2.removeAttribute('hidden')
  //   // editTitleBtn.removeAttribute('hidden')
  //   // alert(title)
  //   alert('', '', title, 'success', false, true)
  // }
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

    // updateProjectData()
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
    // const modal = document.getElementById('modal')
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
    // let updateColText
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
    // let updateCardText
    // const cardText = document.getElementById(`card-text-${ card }`).innerText
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
    // const cardContainer = document.getElementById(`cards-${ card }`)
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
    // const addBtnDiv = document.createElement('div')
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
        console.log(el.parentElement.parentElement.querySelector('form textarea'))
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
    window.localStorage.clear()
    user.leave()
    // document.querySelector('.wrap').style.visibility = 'visible' // "visible"
    // document.getElementById('columnsContainer').innerHTML = ''
    // buildRetrievedProject(json)
    updateProgress()
    await import('../Signing'/* webpackChunkName:"signing" */).then(module => module.default())
  }

  document.getElementById('logOut').addEventListener('click', () => logout())

  // search
  document.getElementById('filter-search').addEventListener('keyup', e => {
    const filterRegex = new RegExp(`\\b${ e.target.value }`, 'gi')

    document.querySelectorAll('[data-card-md]').forEach(item => {
      item.classList.toggle('search-hide', !item.innerText.match(filterRegex))
    })
    // alert('', '', 'tesing', 'success', false, false)
  })
}

export default Kanban
