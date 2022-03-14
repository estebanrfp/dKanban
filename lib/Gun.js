import Gun from 'gun/gun'

import 'gun/sea'
import 'gun/lib/webrtc'
// import 'gun/lib/bye'

import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/rindexed'

const peers = [
  'http://localhost:8765/gun',
  'https://relay.peer.ooo/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://guntest.herokuapp.com/gun'
]

const gun = Gun({ peers, localStorage: false })

const user = gun.user()
const SEA = Gun.SEA

user.recall({ sessionStorage: true })

export {
  gun,
  SEA,
  user
}
