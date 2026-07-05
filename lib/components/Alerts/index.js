function createAlert (title, summary, details, severity, dismissible, autoDismiss) {
  const alertClasses = ['alert', 'animated']
  // Entrance matches the message mood: calm fade for success/info,
  // the shake is reserved for warning/danger where alarm is the point.
  alertClasses.push(['warning', 'danger'].includes(severity.toLowerCase()) ? 'alert-shake' : 'alertin')
  alertClasses.push(`alert-${ severity.toLowerCase() }`)

  if (dismissible) {
    alertClasses.push('alert-dismissible')
  }

  const msg = document.createElement('div')
  msg.setAttribute('class', alertClasses.join(' '))

  if (title) {
    const msgTitle = document.createElement('h4')
    msgTitle.innerHTML = title
    msg.appendChild(msgTitle)
  }

  if (summary) {
    const msgSummary = document.createElement('strong')
    msgSummary.innerHTML = summary
    msg.appendChild(msgSummary)
  }

  if (details) {
    const msgDetails = document.createElement('p')
    msgDetails.innerHTML = details
    msg.appendChild(msgDetails)
  }

  if (dismissible) {
    const msgClose = document.createElement('span')
    msgClose.setAttribute('class', 'close')
    msgClose.innerHTML = '&times;'
    msgClose.onclick = () => msg.remove()
    msg.appendChild(msgClose)
  }

  document.getElementById('pageMessages').prepend(msg)
  if (autoDismiss) {
    setTimeout(() => {
      msg.classList.add('alertout')
      setTimeout(() => msg.remove(), 1000)
    }, 3000)
  }
}

export default createAlert
