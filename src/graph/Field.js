// @ts-check

import Node from './Node.js'
import Type from './Type.js'

import '../extension.js'
import { DEFINED_TYPES } from '../const.js'

export default class Field extends Node {
  /**
   * @param {string} name 
   * @param {object|string} schema 
   */
  constructor(name, schema) {
    if (typeof schema == 'string') {
      super(name, { name, type: schema })
    } else {
      super(name, { name, type: '*', ...schema })
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
    if (typeDefinition == 'Enum') {
      if (this.isSelfDefinedEnum) {
        // @ts-ignore
        return new Type(`${this.name.classify()}Value${this.optional ? '?' : ''}`)
      } else {
        return new Type(this.schema.type)
      }
    }
    if (typeDefinition == '*') {
      // @ts-ignore
      return new Type(`${this.name.classify()}${this.optional ? '?' : ''}`)
    } else if (typeDefinition == 'List<*>') {
      // @ts-ignore
      return new Type(`List<${this.name.classify()}>${this.optional ? '?' : ''}`)
    } else {
      return new Type(typeDefinition)
    }
  }

  /**
   * @type {boolean}
   */
  get mutable () {
    return this.schema.annotation == 'mutable'
  }

  /**
   * @type {boolean}
   */
  get writer () {
    return this.schema.annotation == 'writer'
  }

  /**
   * @type {boolean}
   */
  get reference () {
    return this.schema.annotation == 'reference'
  }

  /**
   * @type {boolean}
   */
  get optional () {
    return this.schema.type[this.schema.type.length - 1] == '?'
  }

  /**
   * @type {boolean}
   */
  get isSelfDefined () {
    return ['*', 'List<*>', '*?', 'Enum'].indexOf(this.schema.type) != -1
  }

  /**
   * @returns {object[]}
   */
  captureSubschemas () {
    const subschemas = []
    if (this.isSelfDefined && this.schema.schema) {
      // @ts-ignore
      subschemas.push({ ...this.schema.schema, name: this.name.classify() })
    }
    return subschemas
  }

  get token () {
    return this.schema.token || `$${this.name}`
  }

  get enumValues () {
    const enumValues = this.schema.enum
    if (Array.isArray(enumValues)) {
      return enumValues
    }
    return []
  }

  /**
   * @type {boolean}
   */
   get isEnum () {
    return this.schema.type.replace(/\?$/, '') == 'Enum'
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedEnum () {
    return this.isEnum && Array.isArray(this.schema.enum)
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