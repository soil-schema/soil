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
