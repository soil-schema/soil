// @ts-check

export class ConfigDirective {

  /**
   * @type {string}
   */
  name

  /**
   * @param {string} name
   */
  constructor (name) {
    Object.defineProperty(this, 'name', { value: name })
    this.declarations = {}
  }

  /**
   * @param {string} name 
   * @param {string[]|undefined} defaultValue 
   * @returns {ConfigDirective}
   */
  stringArray (name, defaultValue = undefined) {
    const directiveName = this.name
    this.declarations[name] = function (/** @type {any} */ item) {
      if (typeof item == 'string') return [item]
      if (typeof item == 'object') {
        if (Array.isArray(item)) {
          item.forEach(i => {
            if (typeof i != 'string') throw new InvalidConfigError(`${directiveName}.${name} is not a string array, contains ${typeof i}`)
          })
          return item
        }
      }
      if (typeof item == 'undefined') {
        if (typeof defaultValue != 'undefined') return defaultValue
        else return []
      }
      throw new InvalidConfigError(`${directiveName}.${name} is expected string array or undefined, but actually not (${typeof item})`)
    }
    return this
  }

  /**
   * @param {string} name 
   * @param {string|undefined} defaultValue 
   * @returns {ConfigDirective}
   */
  string (name, defaultValue = undefined) {
    const directiveName = this.name
    this.declarations[name] = function (/** @type {any} */ item) {
      if (typeof item == 'string') return item
      if (typeof defaultValue != 'undefined') {
        if (typeof item == 'undefined') return defaultValue
        throw new InvalidConfigError(`${directiveName}.${name} is expected string or undefined, but actuallly not (${typeof item})`)
      }
      throw new InvalidConfigError(`${directiveName}.${name} is expected string, but actuallly not (${typeof item})`)
    }
    return this
  }

  /**
   * @param {string} name 
   * @returns {ConfigDirective}
   */
   optionalString (name) {
    const directiveName = this.name
    this.declarations[name] = function (/** @type {any} */ item) {
      if (typeof item == 'string') return item
      if (typeof item == 'undefined') return undefined
      throw new InvalidConfigError(`${directiveName}.${name} is expected string or undefined, but actuallly not (${typeof item})`)
    }
    return this
  }

  /**
   * @param {string} name 
   * @param {object} expectedTable 
   * @returns {ConfigDirective}
   */
   stringTable (name, expectedTable = {}, defaultKey = undefined) {
    const directiveName = this.name
    this.declarations[name] = function (/** @type {any} */ item) {
      if (typeof item == 'string' && typeof defaultKey == 'string') {
        return [defaultKey].reduce((result, key) => Object.defineProperty(result, key, { value: item }), {})
      }
      if (typeof item == 'undefined') return expectedTable
      if (typeof item != 'object' || item === null)
        throw new InvalidConfigError(`${directiveName}.${name} is expected string table, but actuallly not (${typeof item})`)
      if (Array.isArray(item))
        throw new InvalidConfigError(`${directiveName}.${name} is expected string table, but actuallly array`)
      let result = Object.assign({}, expectedTable)
      Object.keys(expectedTable).forEach(key => {
        const value = item[key]
        if (typeof value != 'string' && typeof value != 'undefined') {
          throw new InvalidConfigError(`${directiveName}.${name}.${key} is expected string, but actuallly not (${typeof value})`)
        }
        if (key in expectedTable == false)
          throw new InvalidConfigError(`${directiveName}.${name}.${key} is unpermitted key, but actually contains in ${directiveName}.${name}`)
        if (typeof value == 'string') result[key] = value
      })
      return result
    }
    return this
  }

  /**
   * @param {string} name 
   * @returns {ConfigDirective}
   */
   anyStringTable (name) {
    const directiveName = this.name
    this.declarations[name] = function (/** @type {any} */ item) {
      if (typeof item == 'undefined') return {}
      if (typeof item != 'object' || item === null) {
        throw new InvalidConfigError(`${directiveName}.${name} is expected string table, but actuallly not (${typeof item})`)
      }
      let result = {}
      Object.keys(item).forEach(key => {
        const value = item[key]
        if (typeof value != 'string' && typeof value != 'undefined') {
          throw new InvalidConfigError(`${directiveName}.${name}.${key} is expected string, but actuallly not (${typeof value})`)
        }
        if (typeof value == 'string') return result[key] = value
        throw new InvalidConfigError(`${directiveName}.${name}.${key} is unpermitted key, but actually contains in ${directiveName}.${name}`)
      })
      return result
    }
    return this
  }

  /**
   * @param {string} name 
   * @param {number|undefined} defaultValue 
   * @returns {ConfigDirective}
   */
   integer (name, defaultValue = undefined) {
    const directiveName = this.name
    this.declarations[name] = function (/** @type {any} */ item) {
      if (typeof item == 'number') {
        if (/^-?(?:[1-9][0-9]*|0)$/.test(item.toString())) return item
        else throw new InvalidConfigError(`${directiveName}.${name} is expected integer or undefined, but actuallly no-integer (${item})`)
      }
      if (typeof defaultValue != 'undefined') {
        if (typeof item == 'undefined') return defaultValue
        throw new InvalidConfigError(`${directiveName}.${name} is expected integer or undefined, but actuallly not (${typeof item})`)
      }
      throw new InvalidConfigError(`${directiveName}.${name} is expected integer, but actuallly not (${typeof item})`)
    }
    return this
  }

  /**
   * 
   * @param {object} config 
   * @returns {any}
   */
  apply (config) {
    let result = {}
    Object.keys(this.declarations).forEach(name => {
      if (typeof this.declarations[name] == 'function') {
        result[name] = this.declarations[name](config[name])
      } else {
        throw new InvalidConfigError(`Unknown config item at ${this.name}.${name}`)
      }
    })
    return result
  }
}

export class InvalidConfigError extends Error {

}

export default class Config {
  constructor () {
    this.directives = {}
  }

  /**
   * 
   * @param {string} name Directive name
   * @param {(directive: ConfigDirective) => void} declaration
   * @returns {Config}
   */
  addDirective (name, declaration) {
    const directive = new ConfigDirective(name)
    declaration(directive)
    this.directives[name] = directive
    return this
  }

  /**
   * @param {object} config
   */
  build (config) {
    let result = {}
    Object.keys(config || {})
      .filter(key => key in this.directives == false)
      .forEach(key => { throw new InvalidConfigError(`Unknown soil config directive: ${key}`) })
    Object.keys(this.directives).forEach(key => {
      const directive = this.directives[key]
      result[key] = directive.apply((config || {})[key] || {})
    })
    return result
  }
}

new Config()
  .addDirective('swift', swift => {
    swift
      .stringArray('use')
  })