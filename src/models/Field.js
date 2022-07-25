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
    return new Type(this.schema.type.replace(/\?$/, ''))
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
}

/*
  ================================
  Utilities
 */

Field.parse = fields => Object.keys(fields || {}).map(name => new Field(name, fields[name]))