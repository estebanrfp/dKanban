import Gun from 'gun/gun'
import 'gun/lib/webrtc'
import 'gun/lib/bye'
import 'gun/sea'
import 'gun/lib/shim'
import 'gun/lib/then'
import 'gun/lib/not'
import 'gun/lib/radix'

const peers = [
  `${ window.location.origin }/gun`,
  'https://gun-jmd.herokuapp.com/gun',
  'https://gun-srv.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  'https://gun-eu.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun'
]

const gun = Gun({ localStorage: true, peers })

const user = gun.user()
const SEA = Gun.SEA

// user.recall({ sessionStorage: true })

export {
  gun,
  SEA,
  user
}
