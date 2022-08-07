// @ts-check

import http from 'node:http'
import https from 'node:https'

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
    this.context.setHeader(name, this.expandVariables(value))
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
    this.context.setSecureHeader(name, this.expandVariables(value))
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
    this.context.setVar(name, this.expandVariables(value))
  }

  /**
   * `@set-global <name> <value>`
   * 
   * Set varible in root context.
   * if <value> is variable name likes `$variable-name`, it's resolved in current context.
   * 
   * @param {string} name Variable Name
   * @param {string} value Variable Value
   */
  set_global (name, value) {
    this.log('@set-global', name, value)
    this.contextStack[0].setVar(name, this.expandVariables(value))
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
   * @param  {RequestStep} requestStep
   */
  async request (requestStep) {
    requestStep.prepare()
    const BASE_URL = process.env.BASE_URL
    try {
      this.enterContext(new Context('request'))
      const overrides = this.expandVariables(requestStep.overrides)
      this.context.importVars(overrides)
      const actualUrl = `${BASE_URL}${this.expandVariables(requestStep.path)}`
      const options = {
        method: requestStep.method,
        url: actualUrl,
        use_ssl: actualUrl.startsWith('https://'),
        headers: this.getHeaders(),
        body: this.overrideKeys(this.expandVariables(requestStep.mock()), overrides),
      }
      const client = options.use_ssl ? https : http
      const response = await new Promise((resolve, reject) => {
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
        this.log('@request', options.method, options.url)
        request.end()
      })

      try {
        this.enterContext(new Context('response'))
        this.context.setVar('response', response.body)
        requestStep.receiverSteps
          .forEach(step => this.runCommand(step.commandName, ...step.args))
      } finally {
        this.leaveContext() // Leave from response context
      }
    } finally {
      this.leaveContext() // Leave from request context
    }
  }

  /**
   * `@log ...<messages>`
   * 
   * Log messages command.
   * If <messages> contains variable name likes `$variable-name`, it's resolved.
   * @param  {...string} messages 
   */
  log (...messages) {
    this.logs.push(messages.map(message => this.expandVariables(message)).join(' '))
  }

}