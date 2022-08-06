import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'

export const CONTEXT_VARIABLE_PATTERN = /^[a-z0-9_]+$/

export default class ContextVariable {
  /**
   * @type {string}
   */
  name

  /**
   * @type {any}
   * @private
   */
  value

  /**
   * @type {ContextVariable|undefined}
   */
  parent

  /**
   * @type {{ [key: string]: ContextVariable }}
   */
  children = {}

  /**
   * @param {string} name 
   * @param {any} value 
   * @param {ContextVariable|undefined}
   */
  constructor (name, value, parent = undefined) {
    if (CONTEXT_VARIABLE_PATTERN.test(name) == false) {
      throw new ScenarioRuntimeError(`Incorrect context variable name: ${name}`)
    }

    Object.defineProperty(this, 'name', { value: name, enumerable: true })
    Object.defineProperty(this, 'value', { value: value, enumerable: true })
    Object.defineProperty(this, 'parent', { value: parent, enumerable: true })

    if (typeof value == 'object' && value != null) {
      if (value.__variableContextLock === true) {
        throw new ScenarioRuntimeError(`Detect recursive context variable at ${this.variablePath}`)
      }
      value.__variableContextLock = true

      if (Array.isArray(value)) {
        value.forEach((element, index) => {
          this.addChild(`${index}`, element)
        })
      } else {
        Object.entries(value).forEach(([key, value]) => {
          if (/^__/.test(key)) return
          if (typeof value == 'function') return
          this.addChild(key, value)
        })
      }
      delete value.__variableContextLock
    }
  }

  /**
   * @param {string} name 
   * @param {any} value 
   */
  addChild (name, value) {
    this.children[name] = new ContextVariable(name, value, this)
  }

  /**
   * @type {string}
   */
  get variablePath () {
    if (typeof this.parent == 'undefined') {
      return this.name
    } else {
      return `${this.parent.variablePath}.${this.name}`
    }
  }

  /**
   * @param {string} path 
   */
  has (path) {
    var tokens = path.split('.')
    const name = tokens.shift()
    if (name in this.children) {
      if (tokens.length == 0) return true
      return this.children[name].has(tokens.join('.'))
    }
    return false
  }

  /**
   * @param {string} path 
   * @returns {any}
   */
  resolve (path) {
    var tokens = path.split('.')
    const name = tokens.shift()
    if (name == '') return this.value
    if (name in this.children) {
      return this.children[name].resolve(tokens.join('.'))
    }
    return undefined
  }
}