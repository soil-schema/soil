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
    return this.schema.type
  }

  get mutable () {
    return this.schema.mutable || false
  }

  get writer () {
    return this.schema.writer || false
  }

  get optional () {
    return false
  }
}

/*
  ================================
  Utilities
 */

Field.parse = fields => Object.keys(fields || {}).map(name => new Field(name, fields[name]))