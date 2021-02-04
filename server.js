const express = require('express')
const app = express()

app.use(express.static('dist'))

app.get('**', (req, res) => res.sendFile(`${ __dirname }/dist/index.html`))

const server = app.listen(3000, () => {
  const host = server.address().address
  const port = server.address().port

  console.log('Server listening at http://%s:%s', host, port)
})
