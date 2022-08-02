import test from 'ava'
import Runner from '../../src/runner/Runner.js'

import VariableNotFoundError from '../../src/errors/VariableNotFoundError.js'
import Context from '../../src/runner/Context.js'

test('set and resolve var', t => {
  const runner = new Runner(new Context())
  runner.context.setVar('name', 'value')
  t.is(runner.context.resolveVar('$name'), 'value')
  t.throws(() => runner.context.resolveVar('$not_found'), { instanceOf: VariableNotFoundError })
})

test('resolve $env var', t => {
  const runner = new Runner(new Context({ env: { ENV_VAR: 'value' } }))
  t.is(runner.context.resolveVar('$env.ENV_VAR'), 'value')
  t.throws(() => runner.context.resolveVar('$env.NOT_FOUND'), { instanceOf: VariableNotFoundError })
})

test('set and resolve nested var', t => {
  const runner = new Runner(new Context())
  runner.context.setVar('person', { name: 'value' })
  t.is(runner.context.resolveVar('$person.name'), 'value')
  t.throws(() => runner.context.resolveVar('$not_found'), { instanceOf: VariableNotFoundError })
})