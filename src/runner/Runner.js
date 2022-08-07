// @ts-check

import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'

import Scenario from '../graph/Scenario.js'

import VariableNotFoundError from '../errors/VariableNotFoundError.js'
import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'
import Context from './Context.js'
import RequestStep from '../graph/RequestStep.js'

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
   * 
   * @param {string} name 
   * @param {(context: Context) => Promise<void>} contextBlock 
   */
  async doContext (name, contextBlock) {
    try {
      const nextContext = new Context(name)
      this.enterContext(nextContext)
      await contextBlock(nextContext)
    } finally {
      this.leaveContext()
    }
  }

  /**
   * @type {string}
   */
  get contextPath () {
    return this.contextStack.map(context => context.name).join(' » ')
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
   * @param {any} target 
   * @returns {any}
   */
  expandVariables (target) {
    if (typeof target == 'string') {
      return this.contextStack.reverse().reduce((target, context) => context.applyString(target), target)
    } else if (typeof target == 'object') {
      if (target == null) return target
      return Object.keys(target)
        .reduce((result, key) => { return { ...result, [key]: this.expandVariables(target[key]) } }, {})
    } else {
      return target
    }
  }

  /**
   * 
   * @param {any} target 
   * @param {{ [key: string]: string }} overrides
   * @returns {any}
   */
  overrideKeys (target, overrides) {
    if (typeof target == 'object' && target != null) {
      return Object.keys(target)
        .reduce((result, key) => {
          return { ...result, [key]: key in overrides ? overrides[key] : this.overrideKeys(target[key], overrides) }
        }, {})
    }
    return target
  }

  /**
   * 
   * @returns {{ [key: string]: string }}
   */
  getHeaders () {
    // @ts-ignore
    return this.contextStack.reduce((headers, context) => context.applyHeaders(headers), {
      'User-Agent': 'Soil-Scenario-Runner/1.0 (+https://github.com/niaeashes/soil)',
      'Accept': 'application/json, */*;q=0.8'
    })
  }

  /**
   * @param {string} name
   * @returns {any}
   */
  getVar (name) {
    return this.contextStack.reverse()
      .reduce((result, context) => typeof result == 'undefined' ? context.getVar(name) : result, undefined)
  }

  /**
   * 
   * @param {Scenario} scenario 
   */
  async runScenario (scenario) {
    this.enterContext(new Context('scenario'))
    for (const step of scenario.steps) {
      await this.runCommand(step.commandName, ...step.args)
    }
  }

  /**
   * 
   * @param {string} name 
   * @param  {...any} args 
   */
  async runCommand (name, ...args) {
    if (typeof this[`command_${name}`] == 'function') await this[`command_${name}`](...args)
    else throw new ScenarioRuntimeError(`Unknown Command: ${name}`)
  }

  // Commands

  /**
   * `@set-header <name> <value>`
   * 
   * Set http header in root context.
   * variable literal is expanding in current context.
   * 
   * @param {string} name Header Name
   * @param {string} value Header Value
   */
  command_set_header (name, value) {
    this.log('@set-header', name, ':', value)
    this.contextStack[0].setHeader(name, this.expandVariables(value))
  }

  /**
   * `@set-secure-header <name> <value>`
   * 
   * Set http header in root context.
   * variable literal is expanding in current context.
   * 
   * @param {string} name Header Name
   * @param {string} value Header Value
   */
  command_set_secure_header (name, value) {
    this.log('@set-secure-header', name, ':', '******')
    this.contextStack[0].setSecureHeader(name, this.expandVariables(value))
  }

  /**
   * `@set-var <name> <value>`
   * 
   * Set varible in root context.
   * variable literal is expanding in current context.
   * 
   * @param {string} name Variable Name
   * @param {string} value Variable Value
   */
  command_set_var (name, value) {
    this.log('@set-var', name, '=', value)
    this.contextStack[0].setVar(name, this.expandVariables(value))
  }

  /**
   * `@set-local-var <name> <value>`
   * 
   * Set varible in current context.
   * variable literal is expanding in current context.
   * 
   * @param {string} name Variable Name
   * @param {string} value Variable Value
   */
  command_set_local_var (name, value) {
    this.log('@set-local-var', name, '=', value, 'in', this.contextPath)
    this.context.setVar(name, this.expandVariables(value))
  }

  /**
   * `@get-var <name>`
   * 
   * Get varible in current context.
   * This command is for debugging and testing.
   * 
   * @param {string} name Variable Name like `$name`
   * @returns {any}
   */
  command_get_var (name) {
    const value = this.getVar(name)
    this.log('@get-var', name, value)
    return value
  }

  /**
   * `@inspect`
   * 
   * Show variables in this context.
   * 
   * @returns {any}
   */
  command_inspect () {
    this.log('@inspect')
    this.log(` > response:\n${JSON.stringify(this.getVar('$response'), null, 2)}`)
  }

  /**
   * 
   * @param  {RequestStep} requestStep
   */
  async command_request (requestStep) {
    requestStep.prepare()
    const id = Math.floor(Math.random() * 1000)
    const BASE_URL = process.env.BASE_URL
    await this.doContext('request', async requestContext => {

      // Prepare overrides in request block
      const overrides = this.expandVariables(requestStep.overrides)
      requestContext.importVars(overrides)

      // Prepare http request
      const path = this.expandVariables(requestStep.path)
      const queryString = requestStep.endpoint?.buildQueryString(name => this.getVar(`$${name}`)) || ''
      const actualUrl = new URL(`${path}${queryString}`, BASE_URL)
      const options = {
        method: requestStep.method,
        url: actualUrl,
        use_ssl: actualUrl.protocol == 'https',
        headers: this.getHeaders(),
        body: this.overrideKeys(this.expandVariables(requestStep.mock()), overrides),
      }
      const client = options.use_ssl ? https : http

      // Send http request
      const response = await new Promise((resolve, reject) => {
        this.log('@request', options.method, options.url.toString())
        const request = client.request(actualUrl, options, res => {
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
        Object.entries(options.headers).forEach(([name, value]) => {
          request.setHeader(name, value)
          this.log(' >', name, ':', value)
        })
        if (typeof options.body == 'object') {
          const json = JSON.stringify(options.body)
          this.log(' > request body', json)
          request.setHeader('Content-Type', 'application/json; charset=utf8')
          request.setHeader('Content-Length', Buffer.byteLength(json))
          request.write(json)
        }
        request.end()
      })

      if (response.statusCode > 299) {
        console.log('unsuccessful', response.statusCode)
        throw new ScenarioRuntimeError(`Unsuccessful response: ${response.statusCode}`)
      }

      await this.doContext('response', async responseContext => {
        responseContext.setVar('response', response.body)
        for (const step of requestStep.receiverSteps) {
          await this.runCommand(step.commandName, ...step.args)
        }
      })
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
    this.logs.push(messages.map(message => message).join(' '))
  }

}