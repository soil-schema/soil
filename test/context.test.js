import test from "ava"
import context from '../src/context.js'
import Entity from "../src/graph/Entity.js"

test('resolveReference returns null with invalid reference code', t => {
  t.is(context.resolveReference('id'), null)
})

test('resolveReference returns filed with field name from entity in current context', t => {
  const entity = new Entity({
    name: 'Article',
    fields: {
      title: {
        define: 'String',
      },
    },
  })
  const reference = { entity, ...context }.resolveReference('title')
  t.assert(reference.name, 'title')
})

test('resolveReference returns field in another entity with entity and field chain code (likes "Entity.field")', t => {
  const article = new Entity({
    name: 'Article',
    fields: {
      title: {
        define: 'String',
      },
    },
  })
  const author = new Entity({
    name: 'Author',
    fields: {
      name: {
        define: 'String',
      },
    },
  })
  const reference = { entity: article, entities: [article, author], ...context }.resolveReference('Author.name')
  t.assert(reference.name, 'name')
})

test('resolveReference returns entity', t => {
  const article = new Entity({
    name: 'Article',
    fields: {
      title: {
        define: 'String',
      },
    },
  })
  const author = new Entity({
    name: 'Author',
    fields: {
      name: {
        define: 'String',
      },
    },
  })
  const reference = { entity: article, entities: [article, author], ...context }.resolveReference('Author')
  t.assert(reference.name, 'Author')
})