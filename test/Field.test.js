import test from 'ava'
import Field from '../src/models/Field.js'

test('replace returns another Field', t => {
  const target = new Field('name', {
    mutable: true,
    type: 'String',
  })
  const replaced = target.replace('author_name', { mutable: false })

  t.is(target.name, 'name')
  t.is(target.type, 'String')
  t.is(target.mutable, true)
  
  t.is(replaced.name, 'author_name')
  t.is(replaced.type, 'String')
  t.is(replaced.mutable, false)
})

test('constructor supports string schema', t => {
  t.notThrows(() => {
    const name = new Field('name', 'String')
    t.assert(typeof name.schema == 'object')
    t.is(name.schema.name, 'name')
    t.is(name.schema.type, 'String')
  })
})