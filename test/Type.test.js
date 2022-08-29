import test from 'ava'
import Type from '../src/graph/Type.js'
import Node from '../src/graph/Node.js'

import UnresolvedReferenceError from '../src/errors/UnresolvedReferenceError.js'

test('List', t => {
  const type = new Type('List<Record>')
  t.assert(type.isReference)
  t.not(type.isPrimitiveType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.assert(type.isList)

  t.throws(() => {
    type.mock()
  }, { instanceOf: UnresolvedReferenceError })
})

test('String', t => {
  const type = new Type('String')
  t.not(type.isReference)
  t.assert(type.isPrimitiveType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.is(type.mock(), 'string')
})

test('Enum', t => {
  const type = new Type('Enum')
  t.not(type.isReference)
  t.assert(type.isSelfDefinedType)
  t.not(type.isOptional)
  t.assert(type.isEnum)
  t.not(type.isList)

  t.deepEqual(type.mock(), undefined)
})

test('Integer?', t => {
  const type = new Type('Integer?')
  t.not(type.isReference)
  t.assert(type.isPrimitiveType)
  t.assert(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.not(type.mock(), null)
})

test('resolve entity', t => {
  const parent = new Node('Root', {})
  const authorNode = new Node('Author', {})
  parent.addChild(authorNode)

  const type = new Type('Author', parent)
  t.assert(type.isReference)
  t.not(type.isPrimitiveType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.is(type.reference, authorNode)
})

test('isSelfDefinedType', t => {
  t.not(new Type('String').isSelfDefinedType)
  t.not(new Type('Integer').isSelfDefinedType)
  t.not(new Type('List<String>').isSelfDefinedType)
  t.not(new Type('User.gid').isSelfDefinedType)

  t.assert(new Type('*').isSelfDefinedType)
  t.assert(new Type('*?').isSelfDefinedType)
  t.assert(new Type('List<*>').isSelfDefinedType)
  t.assert(new Type('List<*>?').isSelfDefinedType)
  t.assert(new Type('Enum').isSelfDefinedType)
  t.assert(new Type('Enum?').isSelfDefinedType)
})

test('fullreferencePath', t => {
  const parent = new Node('Root', {})
  const authorNode = new Node('Author', {})
  const profileNode = new Node('Profile', {})
  parent.addChild(authorNode)
  parent.addChild(profileNode)

  const result = profileNode.resolve('Author')

  t.assert(result instanceof Node)
})