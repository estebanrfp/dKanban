import Layout from './components/Layout'
// import createAlert from './components/Alerts'
// import { gun } from './Gun'

import './styles.css'

if (navigator.serviceWorker) {
  navigator.serviceWorker.ready.then(registration => registration.update())
} else if (window.applicationCache) {
  window.applicationCache.update()
}

Layout()
