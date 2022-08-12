import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'
import ContextHeader from './ContextHeader.js'
import ContextVariable from './ContextVariable.js'
import FunctionalVariable from './FunctionalVariable.js'

export default class Context {
  /**
   * @type {{ [key: string]: ContextVariable|FunctionalVariable }}
   */
  _space

  /**
   * @type {string}
   */
  name

  /**
   * @param {string} name Context name for displaying hints. 
   */
  constructor (name) {
    Object.defineProperty(this, 'name', { value: name })
    this._space = {}
    this._headers = []

    this.defineDefaultFunctionalVariables()
  }

  /**
   * @private
   */
  defineDefaultFunctionalVariables () {
    this.defineFunctionalVar('env', () => process.env)
    this.defineFunctionalVar('rand', () => Math.floor(Math.random() * 10000))
    this.defineFunctionalVar('timestamp', () => new Date().valueOf())

    // [!] Hide memos
    Object.defineProperty(this, '_keys', { value: undefined, enumerable: false, writable: true })
  }

  /**
   * 
   * @param {string} name 
   * @param {string} value 
   */
  setHeader (name, value) {
    this._headers.push(new ContextHeader(name, value))
  }

  /**
   * 
   * @param {string} name 
   * @param {string} value 
   */
  setSecureHeader (name, value) {
    this._headers.push(new ContextHeader(name, value, { secure: true }))
  }

  /**
   * 
   * @param {{ [key: string]: string }} headers 
   * @returns {{ [key: string]: string }}
   */
  applyHeaders (headers) {
    this._headers.forEach(header => {
      headers[header.name] = header.value
    })
    return headers
  }

  setVar (name, value) {
    // [!] remove keys memo
    this._keys = undefined
    this._space[`$${name}`] = new ContextVariable(name, value)
  }

  importVars (vars) {
    if (typeof vars == 'undefined') return
    Object.entries(vars).forEach(([key, value]) => this.setVar(key, value))
  }

  defineFunctionalVar (name, calc) {
    // [!] remove keys memo
    this._keys = undefined
    this._space[`$${name}`] = new FunctionalVariable(name, calc)
  }

  /**
   * List all full keys stored context variables and functional variables.
   * @returns [string[]]
   */
  keys () {
    // [!] memorization
    if (typeof this._keys == 'undefined')
      this._keys = Object.values(this._space).flatMap(item => item.keys())
    return this._keys
  }

  /**
   * 
   * @param {string} path
   * @returns 
   */
  resolveVar (path) {
    const value = this.getVar(path)
    if (typeof value == 'undefined') {
      throw new ScenarioRuntimeError(`Variable not found \`${path}\``)
    } else {
      return value
    }
  }

  /**
   * 
   * @param {string} path 
   * @returns 
   */
  getVar (path) {
    var tokens = path.split('.')
    const name = tokens.shift()

    if (name in this._space) {
      return this._space[name].resolve(tokens.join('.'))
    }

    return undefined
  }

  /**
   * 
   * @param {string} path 
   * @returns {boolean}
   */
  existsVar (path) {
    return typeof this.getVar(path) != 'undefined'
  }

  interpolate (string) {
    if (typeof string != 'string') throw new ScenarioRuntimeError(`Invalid arguments Context.applyString, string is expected but not in Context<${this.name}>`)
    return string.replaceAll(/\$(?:([a-zA-Z0-9_]+)\.)*([a-zA-Z0-9_]+)\b/g, matches => {
      var tokens = matches.replace(/^\$/, '').split('.')
      var trailing = ''
      while (tokens.length > 0) {
        if (this.keys().includes(tokens.join('.'))) return `${this.getVar(`$${tokens.join('.')}`)}${trailing}`
        trailing = `.${tokens.pop()}${trailing}`
      }
      return matches
    })
  }
}