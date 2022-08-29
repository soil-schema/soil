// @ts-check

import Node from './Node.js'
import Type from './Type.js'

import '../extension.js'
import Entity from './Entity.js'
import AssertionError from '../errors/AssertionError.js'

export default class Field extends Node {
  /**
   * @param {string} name 
   * @param {object|string} schema 
   */
  constructor(name, schema) {
    super(name, schema)
  }

  /**
   * @returns {string?}
   */
  get label () {
    return null
  }

  get type () {
    // @ts-ignore
    return new Type(this.schema.type, this)
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
    return this.type.isOptional
  }

  /**
   * @type {boolean}
   */
  get isSelfDefined () {
    return this.type.isAutoDefiningType
  }

  /**
   * @type {any}
   */
  get defaultValue () {
    return this.schema.default
  }

  /**
   * @returns {object[]}
   */
  captureSubschemas () {
    const subschemas = []
    if (this.type.isAutoDefiningType && this.schema.schema) {
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
    return this.type.isEnum
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedEnum () {
    return this.isEnum && Array.isArray(this.schema.enum)
  }

  mock () {
    if (this.type.isOptional) return null
    if (typeof this.defaultValue != 'undefined') {
      if (this.defaultValue == 'null') return null
      if (this.defaultValue == 'true') return true
      if (this.defaultValue == 'false') return false
      return this.defaultValue
    }
    if (this.isEnum) {
      return this.enumValues[0]
    }
    if (typeof this.schema.examples == 'object') {
      if (Array.isArray(this.schema.examples) == false) {
        throw new SyntaxError(`${this.name}.examples is not an array.`)
      }
      return this.schema.examples[0]
    }
    return this.type.mock()
  }

  /**
   * 
   * @param {any} value 
   * @param {string[]} path
   * @param {{ write: boolean }} options
   * @returns {boolean}
   */
   assert (value, path = [], options = { write: false }) {

    if (typeof value == 'object' && value === null) {
      if (this.type.isOptional == false) {
        throw new AssertionError(`Get null, but non-null field at ${path.join('.')}`)
      }
      return true
    }

    if (this.type.isList && Array.isArray(value) == false) {
      throw new AssertionError(`Get not array, but list field at ${path.join('.')}`)
    }

    if (typeof value == 'string') {
      if (this.type.referenceName == 'String') {
        return true
      } else if (this.type.referenceName == 'Integer') {
        if (/^-?(0|[1-9][0-9]*)$/.test(value) == false) {
          throw new AssertionError(`Invalid Number value ${value} at ${path.join('.')}`)
        }
      } else if (this.type.referenceName == 'Number') {
        if (/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([Ee][\-+]?[0-9]+)?$/.test(value) == false) {
          throw new AssertionError(`Invalid Number value ${value} at ${path.join('.')}`)
        }
      } else if (this.type.referenceName == 'Boolean') {
        if (/^(true|false)$/.test(value) == false) {
          throw new AssertionError(`Invalid Boolean value ${value} at ${path.join('.')}`)
        }
      } else if (this.type.isEnum) {
        if (this.enumValues.includes(value) == false) {
          throw new AssertionError(`Incorrect enum value "${value}", ${this.type.referenceName} allows only ${this.enumValues.join(', ')} at ${path.join('.')}`)
        }
      } else if (this.type.referenceName == 'URL') {
        try {
          new URL(value)
        } catch {
          throw new AssertionError(`Incorrect url value "${value}" at ${path.join('.')}`)
        }
      } else if (this.type.referenceName == 'Timestamp') {
        try {
          // @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse
          Date.parse(value)
        } catch {
          throw new AssertionError(`Incorrect timestamp value "${value}" (supports only iso 8601 format) at ${path.join('.')}`)
        }
      } else {
        throw new AssertionError(`Actual String value, but expected not string (${this.type.referenceName}) at ${path.join('.')}`)
      }
    }

    if (typeof value == 'boolean' && this.type.referenceName != 'Boolean') {
      throw new AssertionError(`Actual Boolean value, but expected not boolean (${this.type.referenceName}) at ${path.join('.')}`)
    }

    if (typeof value == 'object') {
      const reference = this.type.reference

      if (reference instanceof Entity) {
        if (this.type.isList) {
          value.forEach(item => reference.assert(item, path, options))
        } else {
          return reference.assert(value, path, options)
        }
      }
    }

    return true
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