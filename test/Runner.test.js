import test from 'ava'
import Runner from '../src/runner/Runner.js'

import VariableNotFoundError from '../src/errors/VariableNotFoundError.js'

test('set and resolve var', t => {
  const runner = new Runner()
  runner.setVar('name', 'value')
  t.is(runner.resolveVar('$name'), 'value')
  t.throws(() => runner.resolveVar('$not_found'), { instanceOf: VariableNotFoundError })
})

test('resolve $env var', t => {
  const runner = new Runner({ env: { ENV_VAR: 'value' } })
  t.is(runner.resolveVar('$env.ENV_VAR'), 'value')
  t.throws(() => runner.resolveVar('$env.NOT_FOUND'), { instanceOf: VariableNotFoundError })
})