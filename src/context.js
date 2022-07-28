// @ts-check

import Entity from "./graph/Entity.js"
import Field from "./graph/Field.js"

/**
 * 
 * @param {string} definition 
 * @returns {Entity|Field|null}
 */
const resolveReference = function (definition) {

  const { entity, entities } = this

  const tokens = definition.split('.')

  /** @type {Entity|null} */
  var currentEntity = null
  /** @type {Entity[]} */
  var findingCollection = entities || []

  if (entity) {
    const hitReference = entity.resolve(definition)
    if (hitReference) {
      return hitReference
    }
  }

  for (var token of tokens) {
    const hitEntity = findingCollection.find(entity => entity.name == token)
    if (hitEntity) {
      currentEntity = hitEntity
      findingCollection = hitEntity.subtypes
      continue
    }
    if (currentEntity === null) continue
    const hitField = currentEntity.findField(token)
    if (hitField) {
      return hitField
    }
  }

  if (currentEntity) {
    return currentEntity
  }

  return null
}

export default {
  resolveReference,
}