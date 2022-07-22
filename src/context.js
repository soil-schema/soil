const resolveReference = function (definition) {

  const { entity, entities } = this

  if (entity) {
    const field = entity.findField(definition)
    if (field) return field
  }

  if (Array.isArray(entities) && entities.length > 0) {
    const tokens = definition.split('.')
    var currentEntity = null
    for (var token of tokens) {
      const hitEntity = entities.find(entity => entity.name == token)
      if (hitEntity) {
        currentEntity = hitEntity
        continue
      }
      const hitField = currentEntity.findField(token)
      if (hitField) {
        return hitField
      }
    }
    if (currentEntity) {
      return currentEntity
    }
  }

  return null
}

export default {
  resolveReference,
}