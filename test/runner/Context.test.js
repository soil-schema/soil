import test from 'ava'

import Context from '../../src/runner/Context.js'

test('apply', t => {
  const context = new Context()
  context.setVar('response', { name: 'Sample' })
  t.is(context.applyString('no-change'), 'no-change')
  t.not(context.applyString('$rand'), '$rand')
  t.is(context.applyString('$response.name'), 'Sample')
  t.is(context.applyString('$response'), '{$response}')
})

test('apply $rand', t => {
  const context = new Context()
  t.assert(/^User [0-9]+$/.test(context.applyString('User $rand')))
})

test('apply to path likes string', t => {
  const context = new Context()
  context.setVar('id', 10)
  t.is(context.applyString('/users/$id'), '/users/10')
})