import test from 'ava'
import Runner from '../../src/runner/Runner.js'
import Context from '../../src/runner/Context.js'
import ScenarioRuntimeError from '../../src/errors/ScenarioRuntimeError.js'

test('set and resolve var', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.set_var('name', 'value')
  t.is(runner.get_var('$name'), 'value')
  t.throws(() => runner.context.resolveVar('$not_found'), { instanceOf: ScenarioRuntimeError })
})

test('resolve $env var', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  try {
    process.env.ENV_VAR = 'value'
    t.is(runner.get_var('$env.ENV_VAR'), 'value')
    t.is(runner.get_var('$env.NOT_FOUND'), undefined)
  } finally {
    delete process.env.ENV_VAR
  }
})

test('set and resolve nested var', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.set_var('person', { name: 'value' })
  t.is(runner.get_var('$person.name'), 'value')
  t.is(runner.get_var('$not_found'), undefined)
})