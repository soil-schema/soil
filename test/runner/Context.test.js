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