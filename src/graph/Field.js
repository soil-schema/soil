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
    // @ts-ignore
    return new Type(this.schema.type.replace('*', this.name.classify()), this)
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
    return ['*', 'List<*>', '*?', 'Enum'].indexOf(this.schema.type) != -1
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
    return this.type.isEnum
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedEnum () {
    return this.isEnum && Array.isArray(this.schema.enum)
  }

  mock () {
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
   * @returns {boolean}
   */
  assert (value, path = []) {

    if (typeof value == 'object' && value === null && this.type.isOptional == false) {
      throw new AssertionError(`Get null, but non-null field at ${path.join('.')}`)
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
        return reference.assert(value, path)
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