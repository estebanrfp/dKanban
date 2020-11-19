import { gun, SEA } from '../Gun'

const db = gun.get('dkanban').get('boards')

async function submitTask (data) {
  const keys = JSON.parse(window.localStorage.getItem('keys'))
  const currentDate = new Date()
  const currentTime = currentDate.toUTCString()
  data.timestamp = currentTime
  const encriptedData = await SEA.encrypt(data, keys)
  db.set(encriptedData)
}

async function updateTask (data, nodeID) {
  const keys = JSON.parse(window.localStorage.getItem('keys'))

  // const currentDate = new Date()
  // const currentTime = currentDate.toUTCString()

  // data.timestamp = currentTime
  // const nodeID = data.hash
  const encriptedData = await SEA.encrypt(data, keys)
  db.get(keys.pub).put(encriptedData)
}

async function deleteTask (nodeID) {
  const keys = JSON.parse(window.localStorage.getItem('keys'))
  const encryptedData = await SEA.encrypt(null, keys)
  db.get(nodeID).put(encryptedData)
}

export {
  submitTask,
  updateTask,
  deleteTask
}
