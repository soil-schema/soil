import test from 'ava'
import Type from '../../src/graph/Type.js'

test('String', t => {
  const target = new Type('String')

  t.is(target.definitionBody, 'String')
  t.not(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), 'string')
})

test('String?', t => {
  const target = new Type('String?')

  t.is(target.definitionBody, 'String')
  t.assert(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), null)
})

test('Integer', t => {
  const target = new Type('Integer')

  t.is(target.definitionBody, 'Integer')
  t.not(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), 1)
})

test('Integer?', t => {
  const target = new Type('Integer?')

  t.is(target.definitionBody, 'Integer')
  t.assert(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), null)
})

test('Number', t => {
  const target = new Type('Number')

  t.is(target.definitionBody, 'Number')
  t.not(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), 1.0)
})

test('Number?', t => {
  const target = new Type('Number?')

  t.is(target.definitionBody, 'Number')
  t.assert(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), null)
})

test('Boolean', t => {
  const target = new Type('Boolean')

  t.is(target.definitionBody, 'Boolean')
  t.not(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), true)
})

test('Boolean?', t => {
  const target = new Type('Boolean?')

  t.is(target.definitionBody, 'Boolean')
  t.assert(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), null)
})

test('*', t => {
  const target = new Type('*')

  t.is(target.definitionBody, '*')
  t.not(target.isOptional)
  t.assert(target.isSelfDefinedType)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), undefined)
})

test('*?', t => {
  const target = new Type('*?')

  t.is(target.definitionBody, '*')
  t.assert(target.isSelfDefinedType)
  t.assert(target.isOptional)
  t.not(target.isList)
  t.not(target.isReference)

  t.is(target.mock(), null)
})

test('List<String>', t => {
  const target = new Type('List<String>')

  t.is(target.definitionBody, 'String')
  t.assert(target.isList)
  t.not(target.isOptional)
  t.not(target.isReference)

  t.deepEqual(target.mock(), ['string'])
})

test('List<String>?', t => {
  const target = new Type('List<String>?')

  t.is(target.definitionBody, 'String')
  t.assert(target.isList)
  t.assert(target.isOptional)
  t.not(target.isOptionalList)
  t.not(target.isReference)

  t.deepEqual(target.mock(), null)
})

test('List<String?>', t => {
  const target = new Type('List<String?>')

  t.is(target.definitionBody, 'String')
  t.assert(target.isList)
  t.not(target.isOptional)
  t.assert(target.isOptionalList)
  t.not(target.isReference)

  t.deepEqual(target.mock(), [null])
})

test('User (Entity Reference)', t => {
  const target = new Type('User')

  t.is(target.definitionBody, 'User')
  t.not(target.isList)
  t.not(target.isOptional)
  t.not(target.isOptionalList)
  t.assert(target.isReference)

  t.deepEqual(target.mock(), undefined)
})

test('User? (Optional Entity Reference)', t => {
  const target = new Type('User?')

  t.is(target.definitionBody, 'User')
  t.not(target.isList)
  t.assert(target.isOptional)
  t.not(target.isOptionalList)
  t.assert(target.isReference)

  t.deepEqual(target.mock(), null)
})

test('User.id (Field Reference)', t => {
  const target = new Type('User.id')

  t.is(target.definitionBody, 'User.id')
  t.not(target.isList)
  t.not(target.isOptional)
  t.not(target.isOptionalList)
  t.assert(target.isReference)

  t.deepEqual(target.mock(), undefined)
})

test('User.id? (Optional Entity Reference)', t => {
  const target = new Type('User.id?')

  t.is(target.definitionBody, 'User.id')
  t.not(target.isList)
  t.assert(target.isOptional)
  t.not(target.isOptionalList)
  t.assert(target.isReference)

  t.deepEqual(target.mock(), null)
})

test('Article.Comment (Inner Entity Reference)', t => {
  const target = new Type('Article.Comment')

  t.is(target.definitionBody, 'Article.Comment')
  t.not(target.isList)
  t.not(target.isOptional)
  t.not(target.isOptionalList)
  t.assert(target.isReference)

  t.deepEqual(target.mock(), undefined)
})

test('Article.Comment? (Optional Inner Entity Reference)', t => {
  const target = new Type('Article.Comment?')

  t.is(target.definitionBody, 'Article.Comment')
  t.not(target.isList)
  t.assert(target.isOptional)
  t.not(target.isOptionalList)
  t.assert(target.isReference)

  t.deepEqual(target.mock(), null)
})

test('List<Comment> (List Entity Reference)', t => {
  const target = new Type('List<Comment>')

  t.is(target.definitionBody, 'Comment')
  t.assert(target.isList)
  t.not(target.isOptional)
  t.not(target.isOptionalList)
  t.assert(target.isReference)

  t.deepEqual(target.mock(), undefined)
})

test('Enum', t => {
  const target = new Type('Enum')

  t.is(target.definitionBody, 'Enum')
  t.not(target.isList)
  t.not(target.isOptional)
  t.not(target.isOptionalList)
  t.not(target.isReference)
  t.assert(target.isSelfDefinedType)
  t.assert(target.isSelfDefinedEnum)

  t.deepEqual(target.mock(), undefined)
})

test('List<Enum>', t => {
  const target = new Type('List<Enum>')

  t.is(target.definitionBody, 'Enum')
  t.assert(target.isList)
  t.not(target.isOptional)
  t.not(target.isOptionalList)
  t.not(target.isReference)
  t.assert(target.isSelfDefinedType)
  t.assert(target.isSelfDefinedEnum)

  t.deepEqual(target.mock(), undefined)
})

test('toOptional', t => {
  t.not(new Type('String').isOptional)
  t.assert(new Type('String').toOptional().isOptional)
  t.assert(new Type('String?').toOptional().isOptional)
})