import test from 'ava'

import Context from '../../src/runner/Context.js'
import ScenarioRuntimeError from '../../src/errors/ScenarioRuntimeError.js'

test('apply', t => {
  const context = new Context()
  context.setVar('response', { name: 'Sample' })
  t.is(context.expandVariables('no-change'), 'no-change')
  t.not(context.expandVariables('$rand'), '$rand')
  t.is(context.expandVariables('$response.name'), 'Sample')
  t.is(context.expandVariables('$response'), '$response')
  t.throws(() => {
    context.expandVariables({}) // pass no-string
  }, { instanceOf: ScenarioRuntimeError })
})

test('$rand', t => {
  const context = new Context()
  t.regex(context.expandVariables('User $rand'), /^User [0-9]+$/)
})

test('$timestamp', t => {
  const context = new Context()
  t.regex(context.expandVariables('$timestamp@example.com'), /^[0-9]+@example.com$/)
})

test('apply to path likes string', t => {
  const context = new Context()
  context.setVar('id', 10)
  t.is(context.expandVariables('/users/$id'), '/users/10')
})

test('bug case: dot annotation', t => {
  const context = new Context()
  /**
   * <bug>
   *   $rand.$timestamp.user matches $rand, $timestamp correctly.
   *   but incorrect match `$timestamp.user` string pattern and don't replace $timestamp.
   */
  t.regex(context.expandVariables('$rand.$timestamp.user@example.com'), /^[0-9]+.[0-9]+.user@example.com$/)
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