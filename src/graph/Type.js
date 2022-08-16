// @ts-check

import { DEFINED_TYPES } from "../const.js"
import UnresolvedReferenceError from "../errors/UnresolvedReferenceError.js"

import Node from './Node.js'

export default class Type {
  /**
   * @type {string}
   * @readonly
   */
  definition

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
    Object.defineProperty(this, 'definition', { value: definition, enumerable: true })
    Object.defineProperty(this, 'owner', { value: owner, enumerable: false })
  }

  get referenceName () {
    if (this.isList) {
      return this.definition.replace(/^List<(.+)\??>\??/, '$1')
    }
    if (/^Enum\??$/.test(this.definition)) {
      if (this.owner) {
        // @ts-ignore
        return `${this.owner.name.classify()}Value`
      }
    }
    return this.definition.replace(/\?$/, '')
  }

  /**
   * @type {Node|undefined}
   */
  get reference () {
    if (this.isDefinedType || this.isEnum) {
      return void 0
    } else {
      if (typeof this.owner == 'undefined') {
        throw new UnresolvedReferenceError(`Unresolve reference: ${this.referenceName} (nobody owner)`)
      }
      const result = this.owner.resolve(this.referenceName)
      if (typeof result == 'undefined') {
        throw new UnresolvedReferenceError(`Unresolve reference: ${this.referenceName}`)
      }
      return result
    }
  }

  /**
   * @type {boolean}
   */
  get isList () {
    return /^List<.+>/.test(this.definition)
  }

  /**
   * @type {boolean}
   */
  get isEnum () {
    return /^Enum\??$/.test(this.definition)
  }

  /**
   * @type {boolean}
   */
  get isDefinedType () {
    return DEFINED_TYPES.indexOf(this.referenceName) != -1
  }

  /**
   * @type {boolean}
   */
  get isAutoDefiningType () {
    return ['*', 'List<*>', '*?', 'List<*>?', 'Enum'].indexOf(this.definition) != -1
  }

  /**
   * @type {boolean}
   */
  get isOptional () {
    return /\?$/.test(this.definition)
  }

  /**
   * @returns {Type}
   */
  toOptional () {
    if (this.isOptional) {
      return this
    } else {
      return new Type(`${this.definition}?`, this.owner)
    }
  }

  mock () {
    if (this.isList) {
      return [this.mockValue()]
    } else {
      return this.mockValue()
    }
  }

  /**
   * @private
   * @returns {any} 
   */
  mockValue () {
    if (this.isDefinedType) {
      switch (this.referenceName) {
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
    if (typeof this.reference == 'object') {
      // @ts-ignore
      if (typeof this.reference.mock == 'function') {
        // @ts-ignore
        return this.reference.mock()
      }
    }
  }
}