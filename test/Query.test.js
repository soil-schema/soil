import test from 'ava'
import Query from '../src/graph/Query.js'

test('name', t => {
  const query = new Query('q', {})
  t.is(query.name, 'q')
  t.is(query.type, 'String')
})

test('default', t => {
  const query = new Query('sort', { default: 'created_at' })
  t.is(query.defaultValue, 'created_at')
  t.is(query.optional, false)
})

test('optional is false with default value', t => {
  const query = new Query('sort', { default: 'created_at' })
  t.is(query.optional, false)
})

test('optional is true without default value', t => {
  const query = new Query('q', {})
  t.is(query.optional, true)
})

test('self designed enum', t => {
  const query = new Query('sort', { type: 'Enum', default: 'created_at', enum: ['created_at', 'modified_at', 'title'] })
  t.assert(query.isSelfDefinedEnum)
  t.is(query.type, 'SortValue')
})

test('referenced enum', t => {
  const query = new Query('sort', { type: 'Enum', enum: 'Sort' })
  t.not(query.isSelfDefinedEnum)
  t.is(query.type, 'Sort')
})

import '../src/swift.js'

test('[Swift] optional string query', t => {
  const query = new Query('q', { type: 'String' })
  t.is(query.renderSwiftMember(), 'public var q: String? = nil')
})

test('[Swift] string query with default value', t => {
  const query = new Query('name', { type: 'String', default: 'tester' })
  t.is(query.renderSwiftMember(), 'public var name: String = "tester"')
})

test('[Swift] integer query with default value', t => {
  const query = new Query('per', { type: 'Integer', default: 12 })
  t.is(query.renderSwiftMember(), 'public var per: Int = 12')
})

test('[Swift] self designed enum query with no default value', t => {
  const query = new Query('sort', { type: 'Enum', enum: ['created_at', 'modified_at', 'title'] })
  t.is(query.renderSwiftMember(), 'public var sort: SortValue? = nil')
})

test('[Swift] self designed enum query with default value', t => {
  const query = new Query('sort', { type: 'Enum', default: 'created_at', enum: ['created_at', 'modified_at', 'title'] })
  t.is(query.renderSwiftMember(), 'public var sort: SortValue = .created_at')
})

test('[Swift] render self designed enum', t => {
  const query = new Query('sort', { type: 'Enum', enum: ['created_at', 'modified_at', 'title'] })
  t.is(query.renderSwiftEnum(), 'public enum SortValue: String { case created_at, modified_at, title }')
})