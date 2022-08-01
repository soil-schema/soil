// @ts-check

import Node from './Node.js'
import Type from './Type.js'

import '../extension.js'

export default class Parameter extends Node {

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
   * @param {object} schema 
   */
  constructor (name, definition, schema) {
    super(name, schema)
    this.definition = definition
  }

  /**
   * @type {Type}
   */
  get type () {
    return new Type(this.definition, this)
  }

  get token () {
    return this.schema.token || '$?'
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
    return this.isEnum && Array.isArray(this.schema.enum)
  }

  get enumValues () {
    if (this.type.isEnum) {
      return this.schema.enum
    }
    return void 0
  }

  /**
   * 
   * @param {string} string 
   * @returns {boolean}
   */
  match (string) {
    switch (this.definition) {
      case 'String':
        return true
      case 'Integer':
        return /^[0-9]+$/.test(string)
      case 'Enum':
        return this.enumValues.indexOf(string) != -1
      default:
        return false
    }
  }
}