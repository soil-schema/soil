import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'
import ContextVariable from './ContextVariable.js'
import FunctionalVariable from './FunctionalVariable.js'

export default class Context {
  /**
   * @type {{ [key: string]: ContextVariable|FunctionalVariable }}
   */
  _space

  /**
   * @param {name} name Context name for displaying hints. 
   */
  constructor (name) {
    Object.defineProperty(this, 'name', { value: name })
    this._space = {}
    this._headers = {}

    this.defineDefaultFunctionalVariables()
  }

  /**
   * @private
   */
  defineDefaultFunctionalVariables () {
    this.defineFunctionalVar('env', () => process.env)
    this.defineFunctionalVar('rand', () => Math.floor(Math.random() * 10000))
    this.defineFunctionalVar('timestamp', () => new Date().valueOf())
  }

  get headers () {
    return Object.assign({}, (this.parent || {}).headers || {}, this._headers)
  }

  setHeader (name, value) {
    if (typeof value == 'string' && value[0] == '$') {
      return this.setHeader(name, this.resolveVar(value))
    }
    this._headers[name] = value
  }

  setVar (name, value) {
    // [!] remove keys memo
    this._keys = undefined
    this._space[`$${name}`] = new ContextVariable(name, value)
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

  applyString (string) {
    if (typeof string != 'string') throw new ScenarioRuntimeError(`Invalid arguments Context.applyString, string is expected but not in Context<${this.name}>`)
    const keys = this.keys()
      .map(key => `$${key}`) // Insert $ at head.
    return string.replaceAll(/\$(?:([a-z0-9_]+)\.)*([a-z0-9_]+)\b/g, matches => {
      if (keys.includes(matches)) {
        return this.getVar(matches)
      } else {
        throw new ScenarioRuntimeError(`Can't find or resolve to non-object value with variable name ${matches}\n${string} in Context<${this.name}>`)
      }
    })
  }
}