import test from "ava";
import ScenarioRuntimeError from '../../src/errors/ScenarioRuntimeError.js'
import ContextVariable from '../../src/runner/ContextVariable.js'

test('name', t => {
  t.is(new ContextVariable('name', 'value').name, 'name')
  t.is(new ContextVariable('another', 'value').name, 'another')
  t.throws(() => new ContextVariable('invalid.name', 'value'), { instanceOf: ScenarioRuntimeError })
})

test('detect recursive', t => {
  t.throws(() => {
    const a = {}
    const b = { a }
    a.b = b
    new ContextVariable('a', a)
  }, { instanceOf: ScenarioRuntimeError })
})

test('variable path', t => {
  const book = { author: { name: 'Dante Alighieri' } }
  const target = new ContextVariable('book', book)
  t.is(target.children['author'].variablePath, 'book.author')
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