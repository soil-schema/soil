import test from 'ava'
import Field from '../src/models/Field.js'

test('hasAnnotation', t => {
  const target = new Field('age', {
    define: '+ReadOnly Integer',
  })
  t.assert(target.hasAnnotation('ReadOnly'))
  t.assert(!target.hasAnnotation('WriteOnly'))
})

test('replace', t => {
  const target = new Field('name', {
    define: 'String',
  })
  const replaced = target.replace('author_name', { define: '+ReadOnly String' })

  t.is(target.name, 'name')
  t.is(target.type, 'String')
  t.deepEqual(target.annotations, [])
  
  t.is(replaced.name, 'author_name')
  t.is(replaced.type, 'String')
  t.deepEqual(replaced.annotations, ['ReadOnly'])
})