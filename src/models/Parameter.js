// @ts-check

import Type from './Type.js'

import '../extension.js'

export default class Parameter {

  /**
   * @type {string}
   */
  name

  /**
   * @type {string}
   */
  definition

  /**
   * @type {object}
   */
  options

  /**
   * @param {string} name 
   * @param {string} definition 
   * @param {object} options 
   */
  constructor (name, definition, options = {}) {
    this.name = name
    this.definition = definition
    this.options = options
  }

  /**
   * @type {Type}
   */
  get type () {
    if (this.isSelfDefinedEnum) {
      // @ts-ignore
      return new Type(this.name.classify(), this.options)
    } else {
      return new Type(this.definition, this.options)
    }
  }

  /**
   * @type {string}
   */
   get summary () {
    return this.options.summary
  }

  /**
   * @type {string}
   */
   get description () {
    return this.options.description
  }

  get token () {
    return this.options.token || '$?'
  }

  /**
   * @type {boolean}
   */
   get isEnum () {
    return this.definition == 'Enum'
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedEnum () {
    return this.isEnum && Array.isArray(this.options.enum)
  }

  get enumValues () {
    const enumValues = this.options.enum
    if (Array.isArray(enumValues)) {
      return enumValues
    }
    return []
  }
}