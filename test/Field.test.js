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
  t.is(name.type.definition, 'String?')
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
  t.is(name.type.definition, 'Author?')
})

test('captureSubschemas', t => {
  const record = new Field('record', { type: '*', schema: { fields: { timestamp: 'Timestamp', body: 'String' } } })
  t.is(record.captureSubschemas().length, 1)
  t.is(record.captureSubschemas()[0].name, 'Record')
})

test('assert string field', t => {
  const name = new Field('name', { type: 'String' })
  t.assert(name.assert('sample'))
  t.assert(name.assert('1'))
})

test('assert integer field', t => {
  const age = new Field('age', { type: 'Integer' })
  t.not(age.assert('sample'))
  t.assert(age.assert('1'))
})

test('assert number field', t => {
  const score = new Field('score', { type: 'Number' })
  t.not(score.assert('sample'))
  t.assert(score.assert('-1'))
  t.assert(score.assert('-12.42'))
  t.assert(score.assert('1E+2'))
})

test('assert boolean field', t => {
  const is_admin = new Field('is_admin', { type: 'Boolean' })
  t.assert(is_admin.assert('true'))
  t.assert(is_admin.assert('false'))
  t.assert(is_admin.assert(true))
  t.assert(is_admin.assert(false))
  t.not(is_admin.assert('string'))
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