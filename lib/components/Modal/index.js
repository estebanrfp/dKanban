import './styles.css'

function showElement (el) {
  el.classList.replace('hidden', 'show')
}
function hideElement (el) {
  el.classList.replace('show', 'hidden')
}

function openModal () {
  const modal = document.getElementById('modal')
  const overlay = document.getElementById('overlay')
  showElement(overlay)
  modal.classList.add('open')
  modal.removeAttribute('hidden')
}

function closeModal () {
  const modal = document.getElementById('modal')
  const modalBody = document.getElementById('modalBody')
  const overlay = document.getElementById('overlay')
  modal.setAttribute('hidden', 'true')
  hideElement(overlay)
  modal.classList.remove('open')
  while (modalBody.hasChildNodes()) {
    modalBody.removeChild(modalBody.firstChild)
  }
}

export {
  openModal,
  closeModal
}
