// @ts-check

import http from 'node:http'

import VariableNotFoundError from '../errors/VariableNotFoundError.js'
import VariableSpace from './VariableSpace.js'

export default class Runner {
  /**
   * @type {object}
   */
  env

  /**
   * @type {object}
   */
  headers

  constructor ({ env = undefined } = {}) {
    this.variableSpace = new VariableSpace(this)
    this.headers = {
      'User-Agent': 'Soil',
    }
    this.env = env || process.env
    this.logs = []
  }

  /**
   * @param  {...string} messages 
   */
  log (...messages) {
    this.logs.push(messages.join(' '))
  }

  run (executable, root) {
    if (typeof executable.execute != 'function') {
      throw new Error('Invalid Executable')
    }
    executable.execute(this, root)
  }

  /**
   * @param {string} name 
   * @param {any} value 
   */
   setHeader (name, value) {
    this.variableSpace.setHeader(name, value)
  }

  /**
   * @param {string} name 
   * @param {any} value 
   */
  setVar (name, value) {
    this.variableSpace.setVar(name, value)
  }

  /**
   * @type {string|undefined}
   * @private
   */
  resolverLock = undefined

  /**
   * 
   * @param {string} code variable name
   */
  resolveVar (code) {
    if (this.resolverLock == code) { 
      throw new VariableNotFoundError(`Variable not found \`${code}\``)
    }
    try {
      this.resolverLock = code
      return this.variableSpace.resolveVar(code)
    } finally {
      this.resolverLock = undefined
    }
  }

  /**
   * 
   * @param {string} method 
   * @param {string} path 
   * @param {object} body 
   */
  request (method, path, body) {
    const BASE_URL = process.env.BASE_URL
    const actualUrl = `${BASE_URL}${path}`
    const options = {
      method,
    }
    const request = http.request(actualUrl, options, res => {
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        // @ts-ignore
        this.log({ chunk })
      })
      res.on('end', () => {
        this.log('complete response')
      })
    })
    if (typeof body == 'object') {
      request.write(JSON.stringify(body))
    }
    request.end()
    console.log(actualUrl)
  }
}