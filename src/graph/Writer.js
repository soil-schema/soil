// @ts-check

import Node from './Node.js'
import Entity from './Entity.js'
import Field from './Field.js'

export default class Writer extends Node {
  /**
   * @type {Entity}
   */
  entity

  /**
   * @param {Entity} entity 
   */
  constructor(entity) {
    super(`WriteOnly${entity.name}`, entity.schema)
    Object.defineProperty(this, 'entity', { value: entity })
    entity.addChild(this)
  }

  /**
   * 
   * @param {string} referenceBody 
   * @param {boolean} allowGlobalFinding 
   * @returns {Node|undefined}
   */
  resolve (referenceBody, allowGlobalFinding = true) {
    return this.entity.resolve(referenceBody, allowGlobalFinding)
  }

  /**
   * @type {Array<Field>}
   */
  get fields () {
    return this.entity.fields
      .filter(field => field.mutable || field.writer)
  }

  mock () {
    return this.fields.reduce((mock, field) => {
      const type = this.resolve(field.type.referencePath)
      if (type instanceof Entity) {
        if (field.type.isList) {
          mock[field.name] = [type.mock()]
        } else {
          mock[field.name] = type.mock()
        }
      } else {
        mock[field.name] = field.mock()
      }
      return mock
    }, {})
  }
}