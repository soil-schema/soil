// @ts-check

import Model from './Model.js'
import Type from './Type.js'

import '../extension.js'

export default class Field extends Model {
  /**
   * @param {string} name 
   * @param {object|string} schema 
   */
  constructor(name, schema) {
    if (typeof schema == 'string') {
      super(name, { name, type: schema })
    } else {
      super(name, { name, ...schema })
    }
  }

  /**
   * @returns {string?}
   */
  get label () {
    return null
  }

  get type () {
    const typeDefinition = this.schema.type.replace(/\?$/, '')
    if (typeDefinition == '*') {
      // @ts-ignore
      return new Type(this.name.classify())
    } else {
      return new Type(typeDefinition)
    }
  }

  get mutable () {
    return this.schema.annotation == 'mutable'
  }

  get writer () {
    return this.schema.annotation == 'writer'
  }

  get reference () {
    return this.schema.annotation == 'reference'
  }

  get optional () {
    return this.schema.type[this.schema.type.length - 1] == '?'
  }

  get token () {
    return this.schema.token || `$${this.name}`
  }
}

/*
  ================================
  Utilities
 */

  /**
   * 
   * @param {object} fields 
   * @returns 
   */
Field.parse = fields => Object.keys(fields || {}).map(name => new Field(name, fields[name]))