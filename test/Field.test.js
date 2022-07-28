import test from 'ava'
import Field from '../src/graph/Field.js'

test('replace returns another Field', t => {
  const target = new Field('name', {
    annotation: 'mutable',
    type: 'String',
  })
  const replaced = target.replace('author_name', { annotation: undefined })

  t.is(target.name, 'name')
  t.is(target.type.definition, 'String')
  t.is(target.mutable, true)
  
  t.is(replaced.name, 'author_name')
  t.is(replaced.type.definition, 'String')
  t.is(replaced.mutable, false)
})

test('constructor supports string schema', t => {
  const name = new Field('name', 'String')
  t.assert(typeof name.schema == 'object')
  t.is(name.schema.name, 'name')
  t.is(name.schema.type, 'String')
  t.is(name.optional, false)
})

test('optional string field', t => {
  const name = new Field('name', { type: 'String?' })
  t.is(name.optional, true)
  t.is(name.type.definition, 'String')
})

test('reference entity field', t => {
  const name = new Field('author', { annotation: 'reference', type: 'Author' })
  t.is(name.optional, false)
  t.is(name.reference, true)
  t.is(name.type.definition, 'Author')
})

test('optional reference entity field', t => {
  const name = new Field('author', { annotation: 'reference', type: 'Author?' })
  t.is(name.optional, true)
  t.is(name.reference, true)
  t.is(name.type.definition, 'Author')
})

import '../src/swift.js'

test('[Swift] render as member variable string field', t => {
  const field = new Field('name', { type: 'String' })
  t.is(field.renderSwiftMember(), 'public let name: String')
})

test('[Swift] render as member variable mutable optional string field', t => {
  const field = new Field('bio', { annotation: 'mutable', type: 'String?' })
  t.is(field.renderSwiftMember(), 'public var bio: String?')
})