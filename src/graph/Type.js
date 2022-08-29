// @ts-check

import { DEFINED_TYPES } from "../const.js"
import UnresolvedReferenceError from "../errors/UnresolvedReferenceError.js"
import Field from "./Field.js"

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

  /**
   * Definition body (remove optional `?` from `schema.definition`)
   * @type {string}
   */
  get definitionBody () {
    return this.definition.replace(/\??$/, '')
  }

  get referenceName () {
    var name = this.definitionBody

    if (this.isList) {
      name = name.replace(/^List<(.+)\??>/, '$1')
    }

    // // If: Auto defining enum
    // if (this.definitionBody == 'Enum') {
    //   if (this.owner) { // Expect: owner is Field
    //     // @ts-ignore
    //     return `${this.owner.name.classify()}Value`
    //   }
    // }

    // const reference = this.owner?.resolve(this.definitionBody)
    // if (reference instanceof Field && reference.type !== this) {
    //   return reference.type.referenceName
    // }

    if (name == '*') {
      // @ts-ignore
      name = this.owner?.name?.classify()
    }

    return name
  }

  /**
   * @type {Node|undefined}
   */
  get reference () {
    if (!this.isReference) {
      return void 0
    }

    if (typeof this.owner == 'undefined') {
      throw new UnresolvedReferenceError(`Unresolve reference: ${this.referenceName} (nobody owner)`)
    }
    const result = this.owner.resolve(this.referenceName)
    if (typeof result == 'undefined') {
      throw new UnresolvedReferenceError(`Unresolve reference: ${this.owner?.entityPath}.${this.referenceName}`)
    }
    return result
  }

  get fullReferenceName () {
    if (!this.isReference) {
      return this.referenceName
    }
    const reference = this.reference
    if (reference instanceof Field) {
      // @ts-ignore
      return reference.entityPath.replace(reference.name, reference.name.classify())
    }
    if (reference instanceof Node) {
      return reference.entityPath
    }
    return this.referenceName
  }

  /**
   * @type {boolean}
   */
  get isList () {
    return /^List<.+>/.test(this.definition)
  }

  /**
   * If type is NOT default defined type or automatically defining type,
   * it's reference. (`.isReference` is `true`)
   * @type {boolean}
   */
  get isReference () {
    return !this.isDefinedType && !this.isAutoDefiningType
  }

  /**
   * @type {boolean}
   */
  get isEnum () {
    if (this.definitionBody == 'Enum') {
      return true
    }
    const reference = this.owner?.resolve(this.definitionBody)
    if (reference instanceof Field) {
      return reference.type.isEnum
    }
    return false
  }

  /**
   * @type {boolean}
   */
  get isDefinedType () {
    return DEFINED_TYPES.includes(this.referenceName)
  }

  /**
   * @type {boolean}
   */
  get isAutoDefiningType () {
    return ['*', 'List<*>', 'Enum'].includes(this.definitionBody)
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
    if (this.isAutoDefiningType) {
      // @ts-ignore
      const name = this.owner?.name.classify()
      const reference = this.owner?.resolve(name)
      // @ts-ignore
      if (typeof reference?.mock == 'function') {
        // @ts-ignore
        return reference.mock()
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