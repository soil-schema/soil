import test from 'ava'
import Node from '../src/graph/Node.js'
import Parameter from '../src/graph/Parameter.js'

test('enumValues', t => {
  const parameter = new Parameter('category', 'Enum', { enum: ['item-1', 'item-2', 'item-3'] })
  t.is(parameter.enumValues.length, 3)
  t.is(parameter.enumValues[0], 'item-1')
  t.is(parameter.enumValues[2], 'item-3')
})