// @ts-check

import http from 'node:http'
import https from 'node:https'

import Scenario from '../graph/Scenario.js'

import VariableNotFoundError from '../errors/VariableNotFoundError.js'
import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'
import Context from './Context.js'

export default class Runner {
  /**
   * @type {Context[]}
   */
   contextStack = []

  /**
   * 
   * @param {object} config
   */
  constructor (config) {
    this.config = config
    this.logs = []
  }

  /**
   * @param {Context} context 
   */
  enterContext (context) {
    this.contextStack.push(context)
  }

  leaveContext () {
    this.contextStack.pop()
  }

  /**
   * @type {Context}
   */
  get context () {
    if (this.contextStack.length == 0) throw new ScenarioRuntimeError(`Scenario runner use context, but stacked context is not found.`)
    return this.contextStack[this.contextStack.length - 1]
  }

  /**
   * 
   * @param {Scenario} scenario 
   */
  async runScenario (scenario) {
    this.enterContext(new Context('scenario'))
    scenario.steps.forEach(async (step) => await this.runCommand(step.commandName, ...step.args))
  }

  /**
   * 
   * @param {string} name 
   * @param  {...any} args 
   */
  async runCommand (name, ...args) {
    if (typeof this[name] == 'function') await this[name](...args)
    else throw new ScenarioRuntimeError(`Unknown Command: ${name}`)
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
    this.log('@set-header', name, ':', value)
    this.context.setHeader(name, value)
  }

  /**
   * `@set-secure-header <name> <value>`
   * 
   * Set http header in current context.
   * if <value> is variable name likes `$variable-name`, it's resolved.
   * 
   * @param {string} name Header Name
   * @param {string} value Header Value
   */
  set_secure_header (name, value) {
    this.log('@set-secure-header', name, ':', '******')
    this.context.setSecureHeader(name, value)
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
   * `@get-var <name>`
   * 
   * Get varible in current context.
   * This command is for debugging and testing.
   * 
   * @param {string} name Variable Name
   */
  get_var (name) {
    this.log('@get-var', name)
    return this.contextStack.reverse()
      .reduce((result, context) => typeof result == 'undefined' ? context.getVar(name) : result, undefined)
  }

  /**
   * 
   * @param  {...string} args 
   */
   async request (...args) {
    console.log(args)
    // const BASE_URL = process.env.BASE_URL
    // const actualUrl = `${BASE_URL}${path}`
    // const options = {
    //   method,
    //   use_ssl: actualUrl.startsWith('https://'),
    // }
    // const client = options.use_ssl ? https : http
    // this.log('@request', method, actualUrl)
    // return new Promise((resolve, reject) => {
    //   const request = client.request(actualUrl, options, res => {
    //     res.setEncoding('utf8')
    //     var body = ''
    //     res.on('data', (/** @type {string} */ chunk) => {
    //       body += chunk
    //     })
    //     res.on('end', () => {
    //       try {
    //         resolve({ status: res.statusCode, body: JSON.parse(body) })
    //         this.log(' > receive response.')
    //       } catch (error) {
    //         reject(error)
    //       }
    //     })
    //   })
    //   Object.keys(this.context.headers).forEach(name => {
    //     const value = this.context.headers[name]
    //     request.setHeader(name, value)
    //     this.log(' >', name, ':', value)
    //   })
    //   if (typeof body == 'object') {
    //     const json = JSON.stringify(body)
    //     this.log(' > request body', json)
    //     request.setHeader('Content-Length', Buffer.byteLength(json))
    //     request.write(json)
    //   }
    //   request.end()
    // })
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
          return this.context.resolveVar(message)
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