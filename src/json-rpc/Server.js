export default class Server {
  /**
   * 
   * @param {any} callerObject 
   */
  constructor (callerObject) {
    this.__listeners = {}
    this.__buffer = ''
    this.__caller = callerObject
  }

  /**
   * 
   * @param {ReadStream} readStream 
   */
  listen (readStream) {
    console.log('Start listem read stream')
    readStream.on('readable', async () => {
      const data = readStream.read().toString('utf-8')
      this.__buffer += data
      try {
        const length = await this.read(this.__buffer)
        this.__buffer = this.__buffer.substring(length)
      } catch (error) {
        console.error('Reading Error:', error.name, error.message)
        console.log(this.__buffer, '[EOL]')
      }
    })
    return new Promise(resolve => {
      readStream.on('end', () => {
        console.log('End read stream')
        resolve()
      })
      readStream.on('error', error => {
        console.error('Error:', error.message)
        resolve()
      })
    })
  }

  pipe (writeStream) {
    this.__output = writeStream
  }

  async write (body) {
    const bodyString = JSON.stringify({ jsonrpc: '2.0', ...body })
    const encoded = new TextEncoder("utf-8").encode(bodyString)
    console.log(bodyString)
    const headers = {
      'Content-Length': encoded.length,
      'Content-Type': 'application/json',
    }
    const message = Object.entries(headers).map(header => header.join(': ')).join('\r\n') + '\r\n\r\n'
    this.__output.write(message)
    this.__output.write(encoded)
  }

  /**
   * 
   * @param {string} body 
   */
  async read (body) {
    var buffer = body
    var headers = {}
    var length = 0

    var headerLine = undefined

    do {
      headerLine = buffer.match(/^((?:(?:[A-Z][a-z]+)\-)*(?:[A-Z][a-z]+)):[ \t]*([^\r\n]+)\r?\n/)
      if (headerLine) {
        headers[headerLine[1]] = headerLine[2]
        buffer = buffer.substring(headerLine[0].length)
        length += headerLine[0].length
      }
    } while (headerLine)

    if (/^\r?\n/.test(buffer) == false) {
      throw new Error('Stop reading message: Invalid headers and body separator')
    }
    const separatorLength = buffer.match(/^\r?\n/)[0].length
    length += separatorLength
    buffer = buffer.substring(separatorLength)

    const contentLength = headers['Content-Length']
    if (typeof contentLength == 'undefined') throw new Error('Stop reading message: Content-Length is not found')

    const message = buffer.substring(0, contentLength)
    length += contentLength
    if (message.length != contentLength) throw new Error('Stop reading message: Content Length is too short')

    const payload = JSON.parse(message)
    console.log({ headers, payload })

    const { id, method } = payload

    if (typeof this.__listeners[method] == 'undefined') {
      console.error(`Listener not found: \`${method}\` ${typeof id == 'undefined' ? '' : `id: ${id}`}`)
    } else {
      this.__listeners[method](payload)
        .then(result => {
          if (result) this.write({ id, result })
        })
        .catch(error => {
          console.log('Error on ', method, error.name, error.stack || error.message)
        })
    }

    return length
  }

  defineMethod (name, callback) {
    console.log('register method', name)
    this.__listeners[name] = callback.bind(this.__caller)
  }

  defineReceiveNotification (name, callback) {
  }

  sendNotification () {

  }
}