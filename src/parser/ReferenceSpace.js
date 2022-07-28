// @ts-check

import DuplicatedNameError from '../errors/DuplicatedNameError.js'
import Entity from '../graph/Entity.js'

export default class ReferenceSpace {

  constructor () {
    this.globalEntities = {}
  }

  /**
   * @param {Entity} entity 
   */
  registerEntity (entity) {
    if (typeof this.globalEntities[entity.name] == 'undefined' ) {
      this.globalEntities[entity.name] = entity
    } else {
      throw new DuplicatedNameError(entity.name, this.globalEntities[entity.name], entity)
    }
  }

  /**
   * @param {string} reference 
   * @param {object} context
   */
  resolveReference (reference, { entity = null } = {}) {
    if (entity instanceof Entity) {
      const hitSubtype = entity.findSubtype(reference)
      if (hitSubtype) {
        return hitSubtype
      }
    }
    if (typeof this.globalEntities[reference] != 'undefined') {
      return this.globalEntities[reference]
    }
  }
}