import test from 'ava'
import Entity from '../src/models/Entity.js'

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