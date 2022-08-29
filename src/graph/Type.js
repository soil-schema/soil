// @ts-check

import { PRIMITIVE_TYPES } from "../const.js"

import Node from './Node.js'

/**
 * Type definition string parser.
 */
export default class Type {

  /**
   * @type {string}
   * @readonly
   */
  definition

   /**
    * Type definition has optional suffix.
    * @type {boolean}
    * @readonly
    */
  isOptional
 
   /**
    * Type definition has List wrapper.
    * @type {boolean}
    */
  isList

  /**
   * @type {Node}
   * @readonly
   */
  owner

  /**
   * @param {string} definition
   * @param {Node|undefined} owner
   */
  constructor (definition, owner = undefined) {
    Object.defineProperty(this, 'isOptional', { value: /\?$/.test(definition) })
    Object.defineProperty(this, 'isList', { value: /^List<.+>\??$/.test(definition) })
    Object.defineProperty(this, 'definition', { value: definition, enumerable: true })
    Object.defineProperty(this, 'owner', { value: owner, enumerable: false })
  }

  /**
   * Definition body (remove optional `?` from `schema.definition`)
   * @type {string}
   */
   get definitionBody () {
    var body = this.definition.replace(/\??$/, '')
    if (this.isList) {
      body = body.replace(/^List<([^>\?]+)\??>$/, '$1')
    }
    return body
  }

  /**
   * If type is NOT default defined type or automatically defining type,
   * it's reference. (`.isReference` is `true`)
   * 
   * @type {boolean}
   */
  get isReference () {
    return !(this.isPrimitiveType || this.isSelfDefinedType)
  }

  get isOptionalList () {
    return this.isList && /^List<.+\?>/.test(this.definition)
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedEnum () {
    return this.definitionBody == 'Enum'
  }

  /**
   * @type {boolean}
   */
  get isPrimitiveType () {
    return PRIMITIVE_TYPES.includes(this.definitionBody)
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedType () {
    return ['*', 'Enum'].includes(this.definitionBody)
  }

  /**
   * Convert optional type.
   * @returns {Type}
   */
  toOptional () {
    if (this.isOptional) {
      return this
    } else {
      return new Type(`${this.definition}?`, this.owner)
    }
  }

  // Mocking

  /**
   * Get mock value.
   * 
   * It this is reference type, this method returns `undefined`.
   * @returns {any}
   */
  mock () {
    if (this.isOptional) {
      return null
    }
    if (this.isOptionalList) {
      return [null]
    }
    if (this.isReference || this.isSelfDefinedEnum) {
      return
    }
    if (this.isList) {
      return [this.mockValue()]
    }
    return this.mockValue()
  }

  /**
   * @private
   * @returns {any} 
   */
  mockValue () {
    if (this.isPrimitiveType) {
      switch (this.definitionBody) {
        case 'String':
          return 'string'
        case 'Integer':
          return 1
        case 'Number':
          return 1.0
        case 'Boolean':
          return true
      }
    }
  }
}