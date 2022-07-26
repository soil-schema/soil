import test from 'ava'
import Type from '../src/models/Type.js'

test('List', t => {
  const records = new Type('List<Record>')
  t.not(records.isDefinedType)
  t.assert(records.isList)
})

test('String', t => {
  const records = new Type('String')
  t.assert(records.isDefinedType)
  t.not(records.isList)
})

test('Enum', t => {
  const records = new Type('Enum')
  t.assert(records.isAutoDefiningType)
  t.not(records.isList)
})