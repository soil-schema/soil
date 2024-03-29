import test from 'ava'
import Entity from '../src/graph/Entity.js'
import Field from '../src/graph/Field.js'
import Root from '../src/graph/Root.js'

// requireWritable

test('requireWritable returns true when has readonly fields', t => {
  const entity = new Entity({
    name: 'Order',
    fields: [
      {
        name: 'timestamp',
        type: 'Timestamp',
        annotation: 'mutable',
      },
      {
        name: 'id',
        type: 'Integer',
      },
    ],
  })
  t.assert(entity.requireWriter)
})

test('requireWritable returns true when has writeonly fields', t => {
  const entity = new Entity({
    name: 'Account',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'email',
        type: 'String',
        annotation: 'writer',
      },
      {
        name: 'password',
        type: 'String',
        annotation: 'writer',
      },
    ],
  })
  t.assert(entity.requireWriter)
})

test('requireWritable returns false when has no readonly or writeonly fields', t => {
  const entity = new Entity({
    name: 'Person',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'birthday',
        type: 'Date',
      },
    ],
  })
  t.not(entity.requireWriter)
})

// subtypes

test('subtypes defines on schema.subtypes', t => {
  const article = new Entity({
    name: 'Article',
    fields: [
      {
        name: 'author',
        type: 'Author',
      },
    ],
    subtypes: [
      {
        name: 'Author',
        fields: [
          { name: 'name', type: 'String' },
        ],
      },
    ],
  })
  t.assert(article.subtypes.length > 0)
})

test('subtypes embed in fields schema', t => {
  const article = new Entity({
    name: 'Article',
    fields: [
      {
        name: 'author',
        type: '*',
        schema: {
          fields: [
            { name: 'name', type: 'String' },
          ],
        },
      },
    ],
  })
  t.assert(article.subtypes.length > 0)
})

test('subtypes embed  with defining as list in fields schema', t => {
  const product = new Entity({
    name: 'Product',
    fields: [
      {
        name: 'old_orders',
        type: 'List<*>',
        schema: {
          fields: [
            { name: 'name', type: 'String' },
          ],
        },
      },
    ],
  })
  t.assert(product.subtypes.length > 0)
})

test('resolve with self entity name', t => {
  const product = new Entity({
    name: 'Product',
    fields: [
      { name: 'name', type: 'String' },
    ],
  })
  t.is(product.resolve('Product'), product)
})

test('resolve with self field name', t => {
  const product = new Entity({
    name: 'Product',
    fields: [
      { name: 'name', type: 'String' },
    ],
  })
  t.is(product.resolve('name'), product.findField('name'))
})

test('resolve with subtype name', t => {
  const product = new Entity({
    name: 'Product',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'orders',
        type: 'List<*>',
        schema: {
          fields: [
            { name: 'name', type: 'String' },
          ],
        },
      },
    ],
  })
  t.assert(product.resolve('Order') instanceof Entity)
  t.is(product.resolve('Order').name, 'Order')

  t.assert(product.resolve('Order.name') instanceof Field)
  t.is(product.resolve('Order.name').name, 'name')
})

test('entity has only mutable fields, it\'s writable', t => {
  const cat = new Entity({
    name: 'Cat',
    fields: [
      {
        name: 'name',
        type: 'String',
        annotation: 'mutable',
      },
      {
        name: 'color',
        type: 'Enum',
        annotation: 'mutable',
        enum: ['black', 'white', 'gray', 'mosaic'],
      },
    ],
  })
  t.assert(cat.isWritable)
})

test('mock', t => {
  const monster = new Entity({
    name: 'Monster',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'level',
        type: 'Integer',
      },
    ],
  })
  const mock = monster.mock()
  t.assert('name' in mock)
  t.assert('level' in mock)
})

test('mock with list', t => {
  const sample = new Entity({
    name: 'Sample',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'cases',
        type: 'List<String>',
      },
    ],
  })
  const mock = sample.mock()
  t.assert('name' in mock)
  t.assert('cases' in mock)
  t.assert(Array.isArray(mock.cases))
})

test('mock with enum', t => {
  const file = new Entity({
    name: 'File',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'kind',
        type: 'Enum',
        enum: ['image', 'video', 'document'],
      },
    ],
  })
  const mock = file.mock()
  t.assert('name' in mock)
  t.assert('kind' in mock)
  t.is(mock.kind, 'image')
})

test('mock with inner type', t => {
  const person = new Entity({
    name: 'Person',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'contact',
        type: '*',
        schema: {
          fields: [
            { name: 'kind', type: 'String' },
            { name: 'body', type: 'String' },
          ],
        }
      },
    ],
  })
  const mock = person.mock()
  t.deepEqual(mock, {
    name: 'string',
    contact: {
      kind: 'string',
      body: 'string',
    },
  })
})

test('mock with global entity and entity list', t => {
  const book = new Entity({
    name: 'Book',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'spells',
        type: 'List<Spell>',
      },
    ],
  })
  const spell = new Entity({
    name: 'Spell',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'body',
        type: 'String',
      },
    ],
  })
  const root = new Root()
  root.addChild(book)
  root.addChild(spell)
  const mock = book.mock()
  t.assert('name' in mock)
  t.assert('spells' in mock)
  t.assert(Array.isArray(mock.spells))
  mock.spells.forEach(spell => {
    t.assert('name' in spell)
    t.assert('body' in spell)
  })
})

test('assert simple entity', t => {
  const person = new Entity({
    name: 'Person',
    fields: [
      {
        name: 'id',
        type: 'Integer'
      },
      {
        name: 'name',
        type: 'String',
      },
    ],
  })
  t.assert(person.assert({
    id: 0,
    name: 'niaeashes',
  }))
  t.assert(person.assert({
    id: 0,
    name: 'nobody',
    additional_field: true,
  }))
  t.not(person.assert({
    id: 0,
    name: 100,
  }))
})