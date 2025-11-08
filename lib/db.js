import { gdb } from 'https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js'

const db = await gdb('dkanban', {
  rtc: true,
  sm: {
    superAdmins: ['0x0000000000000000000000000000000000000001'],
  },
})

export default db
