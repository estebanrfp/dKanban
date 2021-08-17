import Gun from 'gun/gun'
import 'gun/lib/webrtc'
import 'gun/lib/bye'
import 'gun/sea'

import 'gun/lib/shim'

import 'gun/lib/radix'
import 'gun/lib/radisk'
import 'gun/lib/rindexed'

const peers = [
  // `${ window.location.origin }/gun`,
  'http://localhost:8765/gun',
  'https://gun-jmd.herokuapp.com/gun',
  'https://unstoppable-superpeer.herokuapp.com/gun',
  'https://kmm-gun.herokuapp.com/gun',
  'https://dinamical.herokuapp.com/gun',
  'https://gun-srv.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun'
]

const gun = Gun({ peers, localStorage: true, radisk: true })

const user = gun.user()
const SEA = Gun.SEA

// user.recall({ sessionStorage: true })

export {
  gun,
  SEA,
  user
}
