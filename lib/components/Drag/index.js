function Drag (updateProjectData) {
  function whichChild (el) {
    let i = 0
    while ((el = el.previousSibling) !== null) ++i
    return i
  }

  function colDraggedOver (ev) {
    ev.dataTransfer.dropEffect = 'move'
    const dragOver = ev.target
    const updatedTrackng = dragOver.getAttribute('data-track')
    // const beingDragged = document.querySelector(".dragging");
    const data = ev.dataTransfer.getData('text/plain')
    let draggedEl
    if (data !== '') { // For Firefox
      draggedEl = document.getElementById(data)
    } else { // For Chrome
      draggedEl = document.querySelector('.dragging')
    }
    const draggedParent = draggedEl.parentElement
    if (draggedParent.id !== dragOver.id && draggedParent.classList.contains('cardsContainer') && dragOver.classList.contains('cardsContainer')) {
      const dragOverChildCount = dragOver.childElementCount
      const dragOverLastChild = dragOver.children[dragOver.childElementCount - 1]
      if (dragOverChildCount === 0 || ev.clientY > dragOverLastChild.offsetTop + dragOverLastChild.offsetHeight) {
        dragOver.appendChild(draggedEl)
        dragOver.setAttribute('data-card-track', updatedTrackng)
      }
    }
  }
  function beingDragged (ev) {
    ev.dataTransfer.setData('text/plain', ev.target.id)
    const draggedEl = ev.target
    draggedEl.classList.add('dragging')
  }
  function cardDrag (ev) {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'move'
    const data = ev.dataTransfer.getData('text/plain')
    let draggedEl
    if (data !== '') { // For Firefox
      draggedEl = document.getElementById(data)
    } else { // For Chrome
      draggedEl = document.querySelector('.dragging')
    }
    const dragOver = ev.target
    const dragOverParent = dragOver.parentElement
    const beingDragged = document.querySelector('.dragging')
    const draggedParent = beingDragged.parentElement
    const project = document.getElementById('project')
    const draggedIndex = whichChild(beingDragged)
    const dragOverIndex = whichChild(dragOver)
    if (dragOver.classList.contains('card')) {
      if (draggedParent === dragOverParent) {
        if (draggedIndex < dragOverIndex) {
          draggedParent.insertBefore(dragOver, draggedEl)
        }
        if (draggedIndex > dragOverIndex) {
          draggedParent.insertBefore(dragOver, draggedEl.nextSibling)
        }
      }
      if (draggedParent !== dragOverParent) {
        dragOverParent.insertBefore(draggedEl, dragOver)
      }
    }
    if (dragOver.classList.contains('cardsContainer')) {
      colDraggedOver(ev)
    }
  }
  function colDrag (ev) {
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'move'
    const dragOver = ev.target
    const columnContainer = document.getElementById('columnsContainer')
    const data = ev.dataTransfer.getData('text/plain')
    let draggedEl
    if (data !== '') { // For Firefox
      draggedEl = document.getElementById(data)
    } else { // For Chrome
      draggedEl = document.querySelector('.dragging')
    }
    const draggedIndex = whichChild(draggedEl)
    const dragOverIndex = whichChild(dragOver)

    if (draggedEl.id !== dragOver.id && dragOver.classList.contains('col')) {
      if (draggedIndex < dragOverIndex) {
        columnContainer.insertBefore(dragOver, draggedEl)
      }
      if (draggedIndex > dragOverIndex) {
        columnContainer.insertBefore(dragOver, draggedEl.nextSibling)
      }
    }
  }
  function dragEnd (ev) {
    const draggedEl = ev.target
    const newTracking = draggedEl.parentNode.getAttribute('data-track')
    draggedEl.classList.remove('dragging')
    draggedEl.setAttribute('data-card-track', newTracking)

    updateProjectData()
  }
  function dragDrop (ev) {
    ev.preventDefault()
  }

  document.addEventListener('dragstart', event => beingDragged(event))
  document.addEventListener('dragover', event => {
    const dragging = document.querySelector('.dragging')
    if (dragging.classList.contains('card')) {
      cardDrag(event)
    }
    if (dragging.classList.contains('col')) {
      colDrag(event)
    }
  })

  document.addEventListener('dragend', event => dragEnd(event))
  document.addEventListener('drop', event => dragDrop(event))
}

export default Drag
