// @ts-check

import Node from './Node.js'
import Type from './Type.js'

import '../extension.js'

export default class Query extends Node {

  /**
   * @param {string} name 
   * @param {object} schema 
   */
  constructor (name, schema) {
    super(name, { ...schema, name })
  }

  /**
   * @type {Type}
   */
  get type () {
    return new Type(this.schema.type || 'String', this)
  }

  get defaultValue () {
    return this.schema.default || null
  }

  get enumValues () {
    const enumValues = this.schema.enum
    if (Array.isArray(enumValues) && this.type.isEnum) {
      return enumValues
    }
    return []
  }

  /**
   * @type {boolean}
   */
  get isEnum () {
    return this.schema.type == 'Enum'
  }

  /**
   * @type {boolean}
   */
   get isRequired () {
    return this.schema.annotation == 'required'
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedEnum () {
    return this.isEnum && Array.isArray(this.schema.enum)
  }

  /**
   * @returns {boolean}
   */
  get required () {
    if (this.schema.required == true) {
      return true
    }
    return false
  }
}

Query.parse = queryList => Object.keys(queryList || {}).map(name => new Query(name, queryList[name]))