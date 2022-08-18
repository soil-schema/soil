import ScenarioRuntimeError from "../errors/ScenarioRuntimeError.js"

export default class FunctionalVariable {
  /**
   * @type {string}
   * @readonly
   */
  name

  /**
   * @type {(key: string) -> any}
   * @private
   */
  calc

  /**
   * @type {any}
   * @private
   */
  _cache

  /**
   * @param {string} name
   * @param {(key: string) -> any} calc 
   */
  constructor (name, calc) {
    Object.defineProperty(this, 'name', { value: name })
    Object.defineProperty(this, 'calc', { value: calc })

    // [!] Hide memos
    Object.defineProperty(this, '_cache', { value: undefined, enumerable: false, writable: true })
  }

  /**
   * @type {any}
   */
  get value () {
    if (typeof this._cache != 'undefined') return this._cache
    try {
      this._cache = this.calc()
      return this._cache
    } catch (error) {
      throw new ScenarioRuntimeError(`functional variable throws an error (${error.constructor.name}) at ${this.name}\n${error.message}`)
    }
  }

  /**
   * Get actual value at path (is not context variable)
   * @param {string} path 
   * @returns {any|undefined}
   */
  resolve (path) {
    var resolved = this.value
    if (path == '') return resolved
    for (const name of path.split('.')) {
      resolved = resolved[name]
    }
    return resolved
  }

  /**
   * @returns {string[]}
   */
  keys () {
    if (typeof this.value == 'object' && this.value != null) {
      // TODO: support nested object
      return Object.keys(this.value).flatMap(key => `${this.name}.${key}`)
    }
    return [this.name]
  }
}