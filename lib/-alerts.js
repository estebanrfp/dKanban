function x (e) {
  const div = e.target.parentElement
  div.style.opacity = '0'
  setTimeout(() => { div.style.display = 'none' }, 600)
}

function Alert (message, mode = null) {
  document.querySelector('.notifications').innerHTML += `
  <div class="alert ${ mode }">
    <span class="closebtn" onclick="x(event)">&times;</span>  
    ${ message }
  </div>`
}

const closes = document.getElementsByClassName('closebtn')
let time = 600
for (const x of closes) {
  x.onclick = e => {
    const div = e.target.parentElement
    div.style.opacity = '0'
    setTimeout(() => { div.style.display = 'none' }, 600)
  }
  setTimeout(() => x.click(), time)
  time = time + 1800
}

export default Alert

// alert('<strong>Danger!</strong> Indicates a dangerous or potentially negative action.')
// alert('<strong>Success!</strong> Indicates a successful or positive action.', 'success')
// alert('<strong>Info!</strong> Indicates a neutral informative change or action.', 'info')
// alert('<strong>Warning!</strong> Indicates a warning that might need attention.', 'warning')

// const close = document.getElementsByClassName('closebtn')
// let time = 600
// for (const x of close) {
//   x.onclick = e => {
//     const div = e.target.parentElement
//     div.style.opacity = '0'
//     setTimeout(() => { div.style.display = 'none' }, 600)
//   }
//   setTimeout(() => x.click(), time)
//   time = time + 1800
// }

// let time = 600
// function alert (message, mode = null) {
//   const div = document.createElement('div')
//   div.classList.add('alert')
//   div.classList.add(mode)
//   div.innerHTML = message

//   const close = document.createElement('span')
//   close.className = 'closebtn'
//   close.innerHTML = '&times;'
//   close.onclick = e => { // remove
//     const div = e.target.parentElement
//     div.style.opacity = '0'
//     setTimeout(() => { div.style.display = 'none' }, 600)
//   }
//   div.appendChild(close)

//   document.querySelector('.notifications').appendChild(div)
//   setTimeout(() => button.click(), time)
//   time = time + 100
// }
