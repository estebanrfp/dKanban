import Gun from 'gun/gun'
// import Gun from 'gun-refactoring/src/index.js'
import SEA from 'gun/sea.js'
import 'gun/axe'

import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/store'
import 'gun/lib/rindexed'
import 'gun/lib/webrtc'
import 'gun/lib/bye'
// import 'gun/nts'

const peers = [
  'http://localhost:8765/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://relay.peer.ooo/gun'
]

const gun = Gun({ peers, localStorage: false })

const user = gun.user()
// const SEA = Gun.SEA

user.recall({ sessionStorage: true })

export {
  gun,
  SEA,
  user
}
