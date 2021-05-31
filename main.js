import { registerSW } from 'virtual:pwa-register'

import './lib/index'

const updateSW = registerSW({
  onNeedRefresh () {
    // show a prompt to user
    console.log('New content available, click on reload button to update.')
  },
  onOfflineReady () {
    console.log('show a ready to work offline to user')
    // show a ready to work offline to user
  }
})

updateSW()
