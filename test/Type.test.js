import test from 'ava'
import Type from '../src/graph/Type.js'
import Node from '../src/graph/Node.js'

import UnresolvedReferenceError from '../src/errors/UnresolvedReferenceError.js'

test('List', t => {
  const type = new Type('List<Record>')
  t.assert(type.isReference)
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
  t.not(type.isReference)
  t.assert(type.isDefinedType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.is(type.mock(), 'string')
})

test('Enum', t => {
  const type = new Type('Enum')
  t.not(type.isReference)
  t.assert(type.isAutoDefiningType)
  t.not(type.isOptional)
  t.assert(type.isEnum)
  t.not(type.isList)

  t.deepEqual(type.mock(), undefined)
})

test('Integer?', t => {
  const type = new Type('Integer?')
  t.not(type.isReference)
  t.assert(type.isDefinedType)
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
  t.not(type.isDefinedType)
  t.not(type.isOptional)
  t.not(type.isEnum)
  t.not(type.isList)

  t.is(type.reference, authorNode)
})

test('definitionBody', t => {
  t.is(new Type('String').definitionBody, 'String')
  t.is(new Type('String?').definitionBody, 'String')
  t.is(new Type('Integer').definitionBody, 'Integer')
  t.is(new Type('Integer?').definitionBody, 'Integer')
  t.is(new Type('List<String>').definitionBody, 'List<String>')
  t.is(new Type('List<String>?').definitionBody, 'List<String>')
  t.is(new Type('User.gid').definitionBody, 'User.gid')
  t.is(new Type('User.gid?').definitionBody, 'User.gid')
  t.is(new Type('*').definitionBody, '*')
  t.is(new Type('*?').definitionBody, '*')
  t.is(new Type('List<*>').definitionBody, 'List<*>')
  t.is(new Type('List<*>?').definitionBody, 'List<*>')
  t.is(new Type('Enum').definitionBody, 'Enum')
  t.is(new Type('Enum?').definitionBody, 'Enum')
})

test('isAutoDefiningType', t => {
  t.not(new Type('String').isAutoDefiningType)
  t.not(new Type('Integer').isAutoDefiningType)
  t.not(new Type('List<String>').isAutoDefiningType)
  t.not(new Type('User.gid').isAutoDefiningType)

  t.assert(new Type('*').isAutoDefiningType)
  t.assert(new Type('*?').isAutoDefiningType)
  t.assert(new Type('List<*>').isAutoDefiningType)
  t.assert(new Type('List<*>?').isAutoDefiningType)
  t.assert(new Type('Enum').isAutoDefiningType)
  t.assert(new Type('Enum?').isAutoDefiningType)
})

test('fullReferenceName', t => {
  const parent = new Node('Root', {})
  const authorNode = new Node('Author', {})
  const profileNode = new Node('Profile', {})
  parent.addChild(authorNode)
  parent.addChild(profileNode)

  const result = profileNode.resolve('Author')

  t.assert(result instanceof Node)
})