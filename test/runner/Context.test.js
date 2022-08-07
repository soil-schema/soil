import test from 'ava'

import Context from '../../src/runner/Context.js'
import ScenarioRuntimeError from '../../src/errors/ScenarioRuntimeError.js'

test('apply', t => {
  const context = new Context()
  context.setVar('response', { name: 'Sample' })
  t.is(context.applyString('no-change'), 'no-change')
  t.not(context.applyString('$rand'), '$rand')
  t.is(context.applyString('$response.name'), 'Sample')
  t.throws(() => {
    context.applyString('$response')
  }, { instanceOf: ScenarioRuntimeError })
  t.throws(() => {
    context.applyString({}) // pass no-string
  }, { instanceOf: ScenarioRuntimeError })
})

test('$rand', t => {
  const context = new Context()
  t.regex(context.applyString('User $rand'), /^User [0-9]+$/)
})

test('$timestamp', t => {
  const context = new Context()
  t.regex(context.applyString('$timestamp@example.com'), /^[0-9]+@example.com$/)
})

test('apply to path likes string', t => {
  const context = new Context()
  context.setVar('id', 10)
  t.is(context.applyString('/users/$id'), '/users/10')
})

test('setVar and resolveVar', t => {
  const context = new Context()
  context.setVar('name', 'value')
  t.is(context.resolveVar('$name'), 'value')
})

test('setVar and resolveVar nested value', t => {
  const context = new Context()
  context.setVar('user', { name: 'value' })
  t.is(context.resolveVar('$user.name'), 'value')
})

test('$env default functional variable', t => {
  const context = new Context()
  process.env.TESTING = '1'
  t.is(context.getVar('$env.TESTING'), '1')
  t.is(context.getVar('$env.TESTING_2'), undefined)
  t.assert(context.keys().includes('env.TESTING'))
})

test('set and apply header', t => {
  const context = new Context()
  context.setHeader('X-Api-Version', '2.0')
  context.setSecureHeader('X-Api-Key', 'api-key')
  const headers = {}
  context.applyHeaders(headers)
  t.deepEqual(headers, { 'X-Api-Version': '2.0', 'X-Api-Key': 'api-key' })
})