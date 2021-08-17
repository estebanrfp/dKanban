import './styles.css'

function createAlert (title, summary, details, severity, dismissible, autoDismiss) {
  function opacity () {
    if (document.getElementById('pageMessages').hasChildNodes()) {
    } else {
    }
  }

  // const iconMap = {
  //   info: 'zmdi zmdi-info-outline',
  //   success: 'zmdi zmdi-thumb-up',
  //   warning: 'zmdi zmdi-alert-triangle',
  //   danger: 'zmdi zmdi-alert-circle-o'
  // }
  // const iconAdded = false

  const alertClasses = ['alert', 'animated', 'alertin']
  alertClasses.push(`alert-${ severity.toLowerCase() }`)

  if (dismissible) {
    alertClasses.push('alert-dismissible')
  }

  // const msgIcon = document.createElement('i')
  // msgIcon.setAttribute('class', iconMap[severity])

  const msg = document.createElement('div')
  msg.setAttribute('class', alertClasses.join(' '))

  if (title) {
    const msgTitle = document.createElement('h4')
    msgTitle.innerHTML = title
    msg.appendChild(msgTitle)

    // if (!iconAdded) {
    //   msgTitle.prepend(msgIcon)
    //   iconAdded = true
    // }
  }

  if (summary) {
    const msgSummary = document.createElement('strong')
    msgSummary.innerHTML = summary
    msg.appendChild(msgSummary)

    // if (!iconAdded) {
    //   msgSummary.prepend(msgIcon)
    //   iconAdded = true
    // }
  }

  if (details) {
    const msgDetails = document.createElement('p')
    msgDetails.innerHTML = details
    msg.appendChild(msgDetails)

    // if (!iconAdded) {
    //   msgDetails.prepend(msgIcon)
    //   iconAdded = true
    // }
  }

  if (dismissible) {
    const msgClose = document.createElement('span')
    msgClose.setAttribute('class', 'close')
    msgClose.setAttribute('data-dismiss', 'alert')
    msgClose.innerHTML = "<i class='zmdi zmdi-close-circle-o'></i>"
    msgClose.onclick = () => {
      msg.remove()
      opacity()
    }
    msg.appendChild(msgClose)
  }

  document.getElementById('pageMessages').prepend(msg)
  if (autoDismiss) {
    setTimeout(() => {
      msg.classList.add('alertout')
      setTimeout(() => {
        msg.remove()
        opacity()
      }, 1000)
    }, 3000)
  }
  opacity()
}

export default createAlert
