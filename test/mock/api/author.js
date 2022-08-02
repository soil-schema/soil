class AuthorController {
  constructor () {
    this.reset()
  }

  reset () {
    this.authors = []
  }

  action (req, res) {
    if (req.method == 'POST' && req.url == '/authors') {
      return this.registerAuthor(req, res)
    }
    if (req.method == 'GET' && req.url == '/authors') {
      return this.getAllAuthors(req, res)
    }
  }

  registerAuthor (req, res) {
    var body = ''
    req.on('data', buffer => body += buffer)
    req.on('end', () => {
      const json = JSON.parse(body)
      console.log('Register Author', json.author)
      this.authors.push(Object.assign({}, json.author, {
        id: this.authors.length,
      }))
      res.write(body)
      res.end()
    })
  }

  getAllAuthors (req, res) {
    res.write(JSON.stringify({ authors: this.authors }))
    res.end()
  }
}

export default new AuthorController()