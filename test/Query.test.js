import test from 'ava'
import Query from '../src/graph/Query.js'

test('name', t => {
  const query = new Query('q', {})
  t.is(query.name, 'q')
  t.is(query.type.definition, 'String')
})

test('default', t => {
  const query = new Query('sort', { default: 'created_at' })
  t.is(query.defaultValue, 'created_at')
})

test('self designed enum', t => {
  const query = new Query('sort', { type: 'Enum', default: 'created_at', enum: ['created_at', 'modified_at', 'title'] })
  t.assert(query.isSelfDefinedEnum)
  t.is(query.type.definition, 'Enum')
})

// test('referenced enum', t => {
//   const query = new Query('sort', { type: 'Enum', enum: 'Sort' })
//   t.not(query.isSelfDefinedEnum)
//   t.is(query.type.definition, 'Sort')
// })

import '../src/swift.js'

test('[Swift] optional string query', t => {
  const query = new Query('q', { type: 'String' })
  t.snapshot(query.swift_Member())
})

test('[Swift] string query with default value', t => {
  const query = new Query('name', { type: 'String', default: 'tester' })
  t.snapshot(query.swift_Member())
})

test('[Swift] integer query with default value', t => {
  const query = new Query('per', { type: 'Integer', default: 12 })
  t.snapshot(query.swift_Member())
})

test('[Swift] self designed enum query with no default value', t => {
  const query = new Query('sort', { type: 'Enum', enum: ['created_at', 'modified_at', 'title'] })
  t.snapshot(query.swift_Member())
})

test('[Swift] self designed enum query with default value', t => {
  const query = new Query('sort', { type: 'Enum', default: 'created_at', enum: ['created_at', 'modified_at', 'title'] })
  t.snapshot(query.swift_Member())
})

test('[Swift] render self designed enum', t => {
  const query = new Query('sort', { type: 'Enum', enum: ['created_at', 'modified_at', 'title'] })
  t.is(query.swift_Enum(), 'public enum SortValue: String {\ncase created_at\ncase modified_at\ncase title\n}')
})