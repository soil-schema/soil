// @ts-check

import Model from './Node.js'
import Entity from './Entity.js'
import Field from './Field.js'

export default class Writer extends Model {
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
      const type = this.resolve(field.type.referenceName)
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