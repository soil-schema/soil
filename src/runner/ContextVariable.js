import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'

export const CONTEXT_VARIABLE_PATTERN = /^[a-zA-Z0-9_\-]+$/

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

    // [!] Don't permit `undefined` value.
    if (typeof value == 'undefined') {
      value = null
    }

    Object.defineProperty(this, 'name', { value: name, enumerable: true })
    Object.defineProperty(this, 'value', { value: value, enumerable: true })
    Object.defineProperty(this, 'parent', { value: parent, enumerable: true })

    if (this.canAcceptNewChild) {
      if (value.__variableContextLock === true) {
        throw new ScenarioRuntimeError(`Detect circuler object as context variable at ${this.path}`)
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
   * @param {string} path 
   * @param {any} value 
   */
  addChild (path, value) {
    if (this.canAcceptNewChild) {

      var tokens = path.split('.')
      const name = tokens.shift()
 
      if (tokens.length == 0) {
        this.children[name] = new ContextVariable(name, value, this)
      } else if (this.children[name] instanceof ContextVariable) {
        this.children[name].addChild(tokens.join('.'), value)
      } else {
        this.children[name] = new ContextVariable(name, {}, this)
        this.children[name].addChild(tokens.join('.'), value)
      }

      // Temporary code
      if (typeof this.value[name] == 'undefined') {
        this.value[name] = value
      }
    } else {
      const msg = `New context variable named "${name}" is not acceptable by ${this.path} (${this.path} don't accept new child)`
      throw new ScenarioRuntimeError(msg)
    }
  }

  /**
   * @type {string}
   */
  get path () {
    if (typeof this.parent == 'undefined') {
      return this.name
    } else {
      return `${this.parent.path}.${this.name}`
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
   * Get actual value at path (is not context variable)
   * @param {string} path 
   * @returns {any|undefined}
   */
  resolve (path) {
    return this.get(path)?.value
  }

  /**
   * Get child context variable at path.
   * @param {string} path 
   * @returns {ContextVariable}
   */
  get (path) {
    var tokens = path.split('.')
    const name = tokens.shift()
    if (name == '') return this
    if (name in this.children) {
      return this.children[name].get(tokens.join('.'))
    }
    return undefined
  }

  /**
   * Return true when this context variable can accept a new child variable, if not false.
   * @type {boolean}
   */
  get canAcceptNewChild () {
    return typeof this.value == 'object' && this.value != null
  }

  /**
   * @type {boolean}
   */
  get hasChildren () {
    return this.canAcceptNewChild && this.children != {}
  }

  /**
   * @returns {string[]}
   */
  keys () {
    if (this.hasChildren) {
      return Object
        .values(this.children)
        .flatMap(child => child.keys())
    } else {
      return [this.path]
    }
  }
}