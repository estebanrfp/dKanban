import Layout from './components/Layout'
import createAlert from './components/Alerts'
import { gun } from './Gun'

import './styles.css'

// // we check if the browser supports ServiceWorkers
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/service-worker.js').then(reg => {
//     reg.installing // the installing worker, or undefined
//     reg.waiting // the waiting worker, or undefined
//     reg.active // the active worker, or undefined
  
//     reg.addEventListener('updatefound', () => {
//       // A wild service worker has appeared in reg.installing!
//       const newWorker = reg.installing;
  
//       newWorker.state;
//       // "installing" - the install event has fired, but not yet complete
//       // "installed"  - install complete
//       // "activating" - the activate event has fired, but not yet complete
//       // "activated"  - fully active
//       // "redundant"  - discarded. Either failed install, or it's been
//       //                replaced by a newer version
  
//       // newWorker.state has changed
//       newWorker.addEventListener('statechange', () => console.log(newWorker.state))
//     })
//   })
  
//   navigator.serviceWorker.addEventListener('controllerchange', () => {
//     // This fires when the service worker controlling this page
//     // changes, eg a new worker has skipped waiting and become
//     // the new active worker.
//     navigator.serviceWorker.controller.postMessage("clearCache")
//     window.location.reload()
    
//     // createAlert('', 'New update', `Refresh your browser !
//     // <span class="actions">
//     //   <input type="button" value="refresh" onClick="window.location.reload();">
//     // </span>
//     // `, 'info', true, false)
//   })
// }

gun.connected((status:any) => {
  if (status) {
    console.log('server onLine')
    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(registration => registration.update())
    } else if (window.applicationCache) {
      window.applicationCache.update()
    }
  } else {
    console.log('server offLine')
  }
})

Layout()
