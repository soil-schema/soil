// @ts-check

import http from 'node:http'

import VariableNotFoundError from '../errors/VariableNotFoundError.js'
import Context from './Context.js'

export default class Runner {
  /**
   * @type {Context}
   */
  context

  /**
   * 
   * @param {Context} context
   */
  constructor (context) {
    this.context = context
    this.logs = []
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
      return this.context.resolveVar(code)
    } finally {
      this.resolverLock = undefined
    }
  }

  /**
   * 
   * @param {string} name 
   * @param  {...any} args 
   */
  async runCommand (name, ...args) {
    if (typeof this[name] == 'function') {
      await this[name](...args)
    } else {
      throw new Error(`Unknown Command: ${name}`)
    }
  }

  // Commands

  /**
   * `@set-header <name> <value>`
   * 
   * Set http header in current context.
   * if <value> is variable name likes `$variable-name`, it's resolved.
   * 
   * @param {string} name Header Name
   * @param {string} value Header Value
   */
  set_header (name, value) {
    this.log('@set-header', name, value)
    this.context.setHeader(name, value)
  }

  /**
   * `@set-var <name> <value>`
   * 
   * Set varible in current context.
   * if <value> is variable name likes `$variable-name`, it's resolved.
   * 
   * @param {string} name Variable Name
   * @param {string} value Variable Value
   */
  set_var (name, value) {
    this.log('@set-var', name, value)
    this.context.setVar(name, value)
  }

  /**
   * 
   * @param {string} method 
   * @param {string} path 
   * @param {object} body 
   */
   async request (method, path, body) {
    return new Promise((resolve, reject) => {
      const BASE_URL = process.env.BASE_URL
      const actualUrl = `${BASE_URL}${path}`
      const options = {
        method,
      }
      const request = http.request(actualUrl, options, res => {
        res.setEncoding('utf8')
        var body = ''
        res.on('data', (/** @type {string} */ chunk) => {
          body += chunk
        })
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body) })
            this.log(' > receive response.')
          } catch (error) {
            reject(error)
          }
        })
      })
      if (typeof body == 'object') {
        request.write(JSON.stringify(body))
      }
      request.end()
      this.log('@request', method, actualUrl)
    })
  }

  /**
   * `@log ...<messages>`
   * 
   * Log messages command.
   * If <messages> contains variable name likes `$variable-name`, it's resolved.
   * @param  {...string} messages 
   */
   log (...messages) {
    this.logs.push(messages.map(message => {
      if (typeof message == 'string' && message.length > 0 && message[0] == '$') {
        try {
          return this.resolveVar(message)
        } catch (error) {
          // skip variable not found error.
          if (error instanceof VariableNotFoundError) {
            return 'undefined'
          }
          throw error
        }
      } else {
        return message
      }
    }).join(' '))
  }

}