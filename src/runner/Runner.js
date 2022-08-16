// @ts-check

import { promises as fs, createWriteStream } from 'node:fs'
import url, { pathToFileURL } from 'node:url'

import Scenario from '../graph/Scenario.js'

import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'
import Context from './Context.js'
import RequestStep from '../graph/RequestStep.js'
import AssertionError from '../errors/AssertionError.js'
import { httpRequest } from '../utils.js'
import Root from '../graph/Root.js'
import { createHash } from 'node:crypto'

export default class Runner {
  /**
   * @type {Context[]}
   */
  contextStack = []

  /**
   * @type {Root|undefined}
   */
  root

  /**
   * 
   * @param {object} config
   * @param {Root|undefined} root
   */
  constructor (config, root) {
    this.config = config
    this.root = root
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
    const override = (source, distination) => {
      if (typeof source == 'number') return Number.parseFloat(distination)
      if (typeof source == 'boolean') {
        if (distination == 'true' || distination == '1') return true
        if (distination == 'false' || distination == '0') return false
        return !!distination
      }
      return distination
    }
    if (typeof target == 'object' && target != null) {
      return Object.keys(target)
        .reduce((result, key) => {
          return { ...result, [key]: key in overrides ? override(target[key], overrides[key]) : this.overrideKeys(target[key], overrides) }
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
      'Cache-Control': 'no-cache',
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

  getVarObject (name) {
    // [!] Non-destructively reversing
    return [...this.contextStack].reverse()
      .find(context => context._space[name])
  }

  /**
   * 
   * @param {Scenario} scenario 
   */
  async runScenario (scenario) {
    // Assert: skip shared scenario
    if (scenario.isShared) return

    this.enterContext(new Context('scenario'))
    try {
      Object.entries(this.config.api.headers).forEach(([key, value]) => {
        this.context.setHeader(key, value)
      })  
      for (const step of scenario.steps) {
        await this.runCommand(step.commandName, ...step.args)
      }
    } finally {
      this.leaveContext()
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
    if (value instanceof Buffer) {
      this.log('@get-var', name, '{binary}')
    } else {
      this.log('@get-var', name, JSON.stringify(value))
    }
    return value
  }

  /**
   * `@inspect`
   * 
   * Show request / response in this context.
   * 
   * @returns {any}
   */
  command_inspect () {
    this.log('@inspect')
    this.log(` > request:\n${JSON.stringify(this.getVar('$request'), null, 2)}`)
    this.log(` > response:\n${JSON.stringify(this.getVar('$response'), null, 2)}`)
  }

  /**
   * `@export-json <value> <filepath>`
   * 
   * Export the variable to JSON file.
   * 
   * @param {string} value Export variable-name.
   * @param {string} filepath Export distination file path.
   */
  async command_export_json (value, filepath) {
    this.log('@export', value, '=>', filepath)
    const target = this.getVar(value)
    if (typeof target == 'undefined') {
      this.log(' > exporting variable not found:', value)
      return
    }
    const body = typeof target == 'string' ? target : JSON.stringify(target, null, 2)
    try {
      await fs.writeFile(filepath, body)
    } catch (error) {
      this.log(' > error:', error.message)
    }
  }

  /**
   * `@import-json <variable-name> <filepath>`
   * 
   * Import JSON file to the variable.
   * 
   * @param {string} name Import variable-name.
   * @param {string} filepath Import source file path.
   */
  async command_import_json (name, filepath) {
    this.log('@import-json', name, '<=', filepath)
    const settableName = name.replace(/^\$/, '')
    try {
      const body = await fs.readFile(filepath, { encoding: this.config.core.encoding })
      // @ts-ignore
      this.context.setVar(settableName, JSON.parse(body))
      this.log(' > Import as JSON file.')
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.log(' > JSON Syntax Error:', error.message)
      } else {
        this.log(' > Error:', error.message)
      }
      const captureStack = this.contextStack.map(context => context)
      throw new ScenarioRuntimeError(`Failed to run @import-json(${name}, ${filepath})`, () => {
        console.log('=== Context ===')
        captureStack.forEach(context => {
          console.log('Context:', context.name)
          console.log(context._space)
        })
      })
    }
  }

  /**
   * `@request-body-from <filepath|url>`
   * 
   * Use the file as `@request` command body.
   * 
   * @param {string} source 
   */
  async command_request_body_from (source) {
    this.log('@request-body-from', source)
    if (source.startsWith('file://')) {
      this.log(' > Load file')
      this.context.setVar('request.body', source)
      return
    }
    if (source.startsWith('unsplash:')) {
      const accessToken = this.config.api.unsplash
      if (typeof accessToken == 'undefined') {
        throw new ScenarioRuntimeError(`Request unsplash schema, but unsplash access token is not setted.`)
      }
      const hash = Math.floor(new Date().valueOf() / 100).toString(16)
      const query = source.replace(/^unsplash:/, '')
      const cacheFileName = `/tmp/soil.${createHash('sha256').update(query).digest('hex')}.${hash.split("").reverse().join("")}.image.cache`
      try {
        await fs.stat(cacheFileName)
        this.log(' > Use file cache:', cacheFileName)
        this.context.setVar('request.body', pathToFileURL(cacheFileName).toString())
      } catch {}
      this.log(' > Fetch file from https://unsplash.com => ', cacheFileName)
      const response = await httpRequest({
        url: `https://api.unsplash.com/photos/random\?query=${encodeURIComponent(query)}`,
        method: 'GET',
        headers: {
          'User-Agent': 'Soil-Scenario-Runner/1.0 (+https://github.com/niaeashes/soil)',
          'Accept': 'application/json',
          'Authorization': `Client-ID ${accessToken}`,
        },
      })
      const imageUrl = JSON.parse(response.body).urls.regular
      const imageResponse = await httpRequest({
        url: imageUrl,
        method: 'GET',
        headers: {
          'User-Agent': 'Soil-Scenario-Runner/1.0 (+https://github.com/niaeashes/soil)',
        },
      })
      await new Promise(resolve => imageResponse.stream
        .pipe(createWriteStream(cacheFileName))
        .on('close', resolve))
      this.log(' > request.body =', pathToFileURL(cacheFileName).toString())
      this.context.setVar('request.body', pathToFileURL(cacheFileName).toString())
    }
    this.context.setVar('request.body', url.pathToFileURL(source).toString())
  }

  /**
   * 
   * @param  {RequestStep} requestStep
   */
  async command_request (requestStep) {
    requestStep.prepare()

    const BASE_URL = this.config.api.base
    this.enterContext(new Context('request'))

    try {
      // Prepare overrides in request block
      const overrides = this.interpolate(requestStep.overrides)
      this.context.importVars(overrides)

      // Prepare http request
      const endpoint = requestStep.endpoint
      const path = this.interpolate(requestStep.path)
      const queryString = requestStep.endpoint?.buildQueryString(name => this.getVar(`$${name}`)) || ''
      const url = `${BASE_URL}${path}${queryString}`
      const request = {
        method: requestStep.method,
        url,
        headers: this.getHeaders(),
        body: this.overrideKeys(this.interpolate(requestStep.mock()), overrides),
      }

      // Set content-type from request mimeType
      if (endpoint?.requestBody.mimeType) {
        request.headers['Content-Type'] = endpoint?.requestBody.mimeType
      }

      this.context.setVar('request', request)

      this.log('@request', request.method, request.url)

      if (requestStep.setupSteps.length) {
        this.log(' > setup steps')
        for (const step of requestStep.setupSteps) {
          await this.runCommand(step.commandName, ...step.args)
        }
      }

      endpoint?.requestBody.assert(this.getVar('$request.body'))

      const response = await httpRequest(this.context.getVar('$request'))
      var body = undefined
      if (/^application\/json;?/.test(response.headers['content-type'] ?? '') && response.body != '') {
        try {
          body = JSON.parse(response.body)
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new AssertionError(' > response content-type header is `application/json`, but failed to parse response as JSON')
          }
        }
      } else {
        this.log(` > Invalid response header: Content-Type is set but not \`application/json\`, actual ${response.headers['content-type']}`)
      }

      this.log(' > receive response:', response.status)

      this.enterContext(new Context('response'))

      try {
        // [!] response context
        this.context.setVar('response', body)

        if (response.status > 299) {
          const captureStack = this.contextStack.map(context => context)
          throw new ScenarioRuntimeError(`Unsuccessful response: ${response.status}`, () => {
            console.log('=== Request ===')
            console.log(JSON.stringify(request, null, 2))
            console.log('=== Response ===')
            console.log(JSON.stringify({ headers: response.headers, body }, null, 2))
            console.log('=== Context ===')
            captureStack.forEach(context => {
              console.log('Context:', context.name)
              console.log(context._space)
            })
          })
        }

        console.log(body)

        /**
         * > A 204 response is terminated by the end of the header section; it cannot contain content or trailers.
         * 
         * so skip content body assertion.
         * 
         * @see https://www.rfc-editor.org/rfc/rfc9110.html#name-204-no-content
         */
        if (response.status != 204) {
          this.log(' > assert response')
          endpoint?.successResponse.assert(body)
        }

        for (const step of requestStep.receiveSteps) {
          await this.runCommand(step.commandName, ...step.args)
        }
      } finally {
        this.leaveContext()
      }
    } finally {
      this.leaveContext()
    }
  }

  /**
   * `@use(<scenario-name>)`
   * 
   * Call shared scenario.
   * 
   * @param {string} name Scenario Name
   */
  async command_use (name) {
    this.log('@use', name)
    const scenario = this.root?.findScenario(name)
    if (scenario instanceof Scenario) {
      this.enterContext(new Context(`scenario(${name})`))
      try {
        for (const step of scenario.steps) {
          await this.runCommand(step.commandName, ...step.args)
        }
      } finally {
        this.leaveContext()
      }
    } else {
      throw new ScenarioRuntimeError(`Scenario not found: ${name}${typeof this.root == 'undefined' ? '- undefined root node' : ''}`)
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
    // @ts-ignore
    if (global.soil?.options?.verbose) {
      console.log(...messages)
    } else {
      this.logs.push(messages.map(message => message).join(' '))
    }
  }

}
