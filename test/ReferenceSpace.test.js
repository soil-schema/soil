import test from 'ava'
import Entity from '../src/graph/Entity.js'
import ReferenceSpace from '../src/parser/ReferenceSpace.js'

test('resolve reference by entity name', t => {
  const space = new ReferenceSpace()
  const entity1 = new Entity({
    name: 'Model1',
  })
  const entity2 = new Entity({
    name: 'Model2',
  })
  space.registerEntity(entity1)
  space.registerEntity(entity2)
  t.is(space.resolveReference('Model1'), entity1)
  t.is(space.resolveReference('Model2'), entity2)
})

test('resolve relative reference', t => {
  const space = new ReferenceSpace()
  const entity1 = new Entity({
    name: 'Model1',
    subtypes: [
      {
        name: 'Subtype1',
      },
    ],
  })
  const entity2 = new Entity({
    name: 'Model2',
    subtypes: [
      {
        name: 'Subtype2',
      },
    ],
  })
  space.registerEntity(entity1)
  space.registerEntity(entity2)
  t.is(space.resolveReference('Subtype1', { entity: entity1 }), entity1.findSubtype('Subtype1'))
  t.is(space.resolveReference('Model1.Subtype2', { entity: entity1 }), entity2.findSubtype('Subtype2'))
})