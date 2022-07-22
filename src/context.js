const resolveReference = function (definition) {

  const { entity, entities } = this

  const tokens = definition.split('.')

  var currentEntity = null
  var findingCollection = entities || []

  if (entity) {
    const hitSubtype = entity.subtypes.find(subtype => subtype.name == definition)
    if (hitSubtype) {
      return hitSubtype
    }
    const hitField = entity.findField(definition)
    if (hitField) {
      return hitField
    }
    if (tokens[0] == entity.name) {
      currentEntity = entity
      findingCollection = entity.subtypes
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