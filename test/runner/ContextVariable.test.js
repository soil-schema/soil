import test from "ava";
import ScenarioRuntimeError from '../../src/errors/ScenarioRuntimeError.js'
import ContextVariable from '../../src/runner/ContextVariable.js'

test('name', t => {
  t.is(new ContextVariable('name', 'value').name, 'name')
  t.is(new ContextVariable('another', 'value').name, 'another')
  // [!] `invalid.name` is incorrect variable name.
  t.throws(() => new ContextVariable('invalid.name', 'value'), { instanceOf: ScenarioRuntimeError })
})

test('detect recursive', t => {
  t.throws(() => {
    const a = {}
    const b = { a }
    a.b = b
    new ContextVariable('a', a)
  }, {
    instanceOf: ScenarioRuntimeError,
    // [!] assert to display the variable path
    message: /\ba\.b\b/,
  })
})

test('variable path', t => {
  const book = { author: { name: 'Dante Alighieri' } }
  const target = new ContextVariable('book', book)
  t.is(target.children['author'].path, 'book.author')
})

test('array', t => {
  const article = { comments: [{ body: 'This is a first comment' }, { body: 'Second one' }] }
  const target = new ContextVariable('article', article)
  t.assert(target.has('comments'))
  t.assert(target.has('comments.0'))
  t.not(target.has('comments.2'))
})

test('resolve', t => {
  const article = { comments: [{ body: 'This is a first comment' }, { body: 'Second one' }] }
  const target = new ContextVariable('article', article)
  t.is(target.resolve('comments.0.body'), 'This is a first comment')
  t.is(target.resolve('comments.1.body'), 'Second one')
  t.is(target.resolve('comments.2.body'), undefined)
})

test('ignore function', t => {
  const user = { name: 'Test User', follow: function () { console.log("Don't call") } }
  const target = new ContextVariable('user', user)
  t.assert(target.has('name'))
  t.not(target.has('follow'))
})

test('list keys', t => {
  const user = { name: 'User Name', contact: { tel: 'xxx-xxxx-xxxx', email: 'xxx@example.com' } }
  t.deepEqual(new ContextVariable('user', user).keys(), ['user.name', 'user.contact.tel', 'user.contact.email'])
  const article = { comments: [{ body: 'This is a first comment' }, { body: 'Second one' }] }
  t.deepEqual(new ContextVariable('article', article).keys(), ['article.comments.0.body', 'article.comments.1.body'])
})