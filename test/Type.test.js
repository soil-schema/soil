import test from 'ava'
import Type from '../src/graph/Type.js'
import Node from '../src/graph/Node.js'

import UnresolvedReferenceError from '../src/errors/UnresolvedReferenceError.js'

test('List', t => {
  const type = new Type('List<Record>')
  t.not(type.isDefinedType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.assert(type.isList)

  t.throws(() => {
    type.mock()
  }, { instanceOf: UnresolvedReferenceError })
})

test('String', t => {
  const type = new Type('String')
  t.assert(type.isDefinedType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.is(type.mock(), 'string')
})

test('Enum', t => {
  const type = new Type('Enum')
  t.assert(type.isAutoDefiningType)
  t.not(type.isOptional)
  t.assert(type.isEnum)
  t.not(type.isList)

  t.throws(() => {
    type.mock()
  }, { instanceOf: UnresolvedReferenceError })
})

test('Integer?', t => {
  const type = new Type('Integer?')
  t.assert(type.isDefinedType)
  t.assert(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.not(type.mock(), null)
})

test('resolve entity', t => {
  const parent = new Node('Root', {})
  const authorNode = new Node('Author', {})
  parent.addChild('Author', authorNode)

  const type = new Type('Author', parent)
  t.not(type.isDefinedType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.is(type.reference, authorNode)
})