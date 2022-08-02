import http from 'node:http'

import author from './author.js'

const server = http.createServer((req, res) => {

  console.log(req.method, req.url)

  res.setHeader('Content-Type', 'application/json')

  if (/^\/authors/.test(req.url)) {
    return author.action(req, res)
  }

  if (req.method == 'POST' && req.url == '/reset') {
    author.reset()
  }

  res.write('{}')
  res.end()
})

server.listen(process.env.PORT || 8080)