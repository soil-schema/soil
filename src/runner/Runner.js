// @ts-check

import http from 'node:http'
import https from 'node:https'
import { URL, urlToHttpOptions } from 'node:url'

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
   * Do string interpolation in current context.
   * 
   * soil finds embed variables e.g. `$variable-name` in string, then it will replace value of the variable.
   * 
   * If target is object, soil dive into object.
   * In other words, soil recursively apply `.interpolate` method to each properties of object.
   * 
   * There is nested variable in current context, e.g. `$user` variable has `$name` and `$age` nested variables,
   * these variables are referenced by dot notation.
   * When the target string is "Name: $user.name" and the value of `$user` > `$name` is `"user-name"`, so it returns "Name: user-name".
   *
   * If target is not string or object, it return as is with no changes.
   * 
   * @param {any} target Interpolate target. It ignore when it's not string or object.
   * @returns {any}
   */
  interpolate (target) {
    if (typeof target == 'string') {
      // [!] Non-destructively reversing
      return [...this.contextStack].reverse()
        .reduce((target, context) => context.interpolate(target), target)
    } else if (typeof target == 'object' && target != null) {
      // Recursively apply to each properties.
      return Object.keys(target)
        .reduce((result, key) => { return { ...result, [key]: this.interpolate(target[key]) } }, {})
    }
    return target
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
      'Accept': 'application/json',
    })
  }

  /**
   * @param {string} name
   * @returns {any}
   */
  getVar (name) {
    // [!] Non-destructively reversing
    return [...this.contextStack].reverse()
      .reduce((result, context) => typeof result == 'undefined' ? context.getVar(name) : result, undefined)
  }

  /**
   * 
   * @param {Scenario} scenario 
   */
  async runScenario (scenario) {
    await this.doContext('scenario', async () => {
      for (const step of scenario.steps) {
        await this.runCommand(step.commandName, ...step.args)
      }
    })
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
    this.log('@set-header', name, ':', this.interpolate(value))
    this.contextStack[0].setHeader(name, this.interpolate(value))
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
    this.contextStack[0].setSecureHeader(name, this.interpolate(value))
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
    this.log('@set-var', name, '=', this.interpolate(value))
    this.contextStack[0].setVar(name, this.interpolate(value))
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
    this.context.setVar(name, this.interpolate(value))
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
    this.log(` > request:\n${JSON.stringify(this.getVar('$request'), null, 2)}`)
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
      const overrides = this.interpolate(requestStep.overrides)
      requestContext.importVars(overrides)

      // Prepare http request
      const path = this.interpolate(requestStep.path)
      const queryString = requestStep.endpoint?.buildQueryString(name => this.getVar(`$${name}`)) || ''
      const actualUrl = new URL(`${BASE_URL}${path}${queryString}`)
      const request = {
        method: requestStep.method,
        path,
        url: actualUrl.toString(),
        headers: this.getHeaders(),
        body: this.overrideKeys(this.interpolate(requestStep.mock()), overrides),
      }
      const client = actualUrl.protocol == 'https:' ? https : http

      requestContext.setVar('request', request)

      // Send http request
      const response = await new Promise((resolve, reject) => {
        const options = {
          method: request.method,
          headers: request.headers,
        }
        var body = undefined
        if (typeof request.body == 'object') {
          body = JSON.stringify(request.body)
          options.headers['Content-Type'] = 'application/json; charset=utf-8'
          options.headers['Content-Length'] = Buffer.byteLength(body).toString()
        }
        this.log('@request', request.method, request.url.toString())
        const req = client.request(actualUrl, options, res => {
          res.setEncoding('utf8')
          var body = ''
          res.on('data', (/** @type {string} */ chunk) => {
            body += chunk
          })
          res.on('end', () => {
            try {
              if (/^application\/json;?/.test(res.headers['content-type'] ?? '') && body != '') {
                body = JSON.parse(body)
              }
              resolve({ status: res.statusCode, body, headers: res.headers })
              this.log(' > receive response:', res.statusCode?.toString() || '???')
              const contentType = res.headers['Content-Type']
              if (typeof contentType == 'string' && contentType.startsWith('application/json') == false) {
                this.log(` > Invalid response header: Content-Type is set but not equals "application/json", actual ${contentType}`)
              }
            } catch (error) {
              reject(error)
            }
          })
        })
        if (body) req.write(body)
        req.end()
      })

      await this.doContext('response', async responseContext => {
        responseContext.setVar('response', response.body)

        if (response.status > 299) {
          const captureStack = this.contextStack
          throw new ScenarioRuntimeError(`Unsuccessful response: ${response.status}`, () => {
            console.log('=== Request ===')
            console.log(JSON.stringify(request, null, 2))
            console.log('=== Response ===')
            console.log(JSON.stringify(response, null, 2))
            console.log('=== Context ===')
            captureStack.forEach(context => {
              console.log('Context:', context.name)
              console.log(context._space)
            })
          })
        }

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