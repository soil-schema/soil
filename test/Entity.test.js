import test from 'ava'
import Entity from '../src/models/Entity.js'
import Field from '../src/models/Field.js'

// requireWritable

test('requireWritable returns true when has readonly fields', t => {
  const entity = new Entity({
    name: 'Order',
    fields: {
      timestamp: {
        define: 'Timestamp',
      },
      id: {
        define: '+Immutable +ReadOnly Integer',
      },
    },
  })
  t.assert(entity.requireWritable)
})

test('requireWritable returns true when has writeonly fields', t => {
  const entity = new Entity({
    name: 'Account',
    fields: {
      name: {
        define: 'String',
      },
      email: {
        define: '+WriteOnly String',
      },
      password: {
        define: '+WriteOnly String',
      },
    },
  })
  t.assert(entity.requireWritable)
})

test('requireWritable returns false when has no readonly or writeonly fields', t => {
  const entity = new Entity({
    name: 'Person',
    fields: {
      name: {
        define: 'String',
      },
      birthday: {
        define: 'Date',
      },
    },
  })
  t.not(entity.requireWritable)
})

// subtypes

test('subtypes defines on schema.subtypes', t => {
  const article = new Entity({
    name: 'Article',
    fields: {
      author: 'Author',
    },
    subtypes: [
      {
        name: 'Author',
        fields: {
          name: 'String',
        },
      },
    ],
  })
  t.assert(article.subtypes.length > 0)
})

test('subtypes embed in fields schema', t => {
  const article = new Entity({
    name: 'Article',
    fields: {
      author: {
        schema: {
          fields: {
            name: 'String',
          },
        },
      },
    },
  })
  t.assert(article.subtypes.length > 0)
})

test('subtypes embed  with defining as list in fields schema', t => {
  const product = new Entity({
    name: 'Product',
    fields: {
      old_orders: {
        define: 'List<{schema}>',
        schema: {
          fields: {
            name: 'String',
          },
        },
      },
    },
  })
  t.assert(product.subtypes.length > 0)
})

test('resolveReference with self entity name', t => {
  const product = new Entity({
    name: 'Product',
    fields: {
      name: 'String',
    },
  })
  t.is(product.resolveReference('Product'), product)
})

test('resolveReference with self field name', t => {
  const product = new Entity({
    name: 'Product',
    fields: {
      name: 'String',
    },
  })
  t.is(product.resolveReference('name'), product.findField('name'))
})

test('resolveReference with subtype name', t => {
  const product = new Entity({
    name: 'Product',
    fields: {
      name: 'String',
      orders: {
        define: 'List<Order>',
        schema: {
          fields: {
            name: 'String',
          },
        },
      },
    },
  })
  t.assert(product.resolveReference('Order') instanceof Entity)
  t.is(product.resolveReference('Order').name, 'Order')

  t.assert(product.resolveReference('Order.name') instanceof Field)
  t.is(product.resolveReference('Order.name').name, 'name')
})