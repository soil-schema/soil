import test from 'ava'
import Runner from '../../src/runner/Runner.js'
import Context from '../../src/runner/Context.js'
import ScenarioRuntimeError from '../../src/errors/ScenarioRuntimeError.js'

test('set and resolve var', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.command_set_var('name', 'value')
  t.is(runner.command_get_var('$name'), 'value')
  t.throws(() => runner.context.resolveVar('$not_found'), { instanceOf: ScenarioRuntimeError })
})

test('resolve $env var', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  try {
    process.env.ENV_VAR = 'value'
    t.is(runner.command_get_var('$env.ENV_VAR'), 'value')
    t.is(runner.command_get_var('$env.NOT_FOUND'), undefined)
  } finally {
    delete process.env.ENV_VAR
  }
})

test('set and resolve nested var', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.command_set_var('person', { name: 'value' })
  t.is(runner.command_get_var('$person.name'), 'value')
  t.is(runner.command_get_var('$not_found'), undefined)

  t.is(runner.interpolate('Name: $person.name'), 'Name: value')
  t.is(runner.interpolate('Value: $not_found'), 'Value: $not_found')
})

test('interpolate call with not string or object', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  t.is(runner.interpolate(1), 1)
  t.is(runner.interpolate(true), true)
  t.is(runner.interpolate(null), null)
})

test('enter and leave context', t => {
  const runner = new Runner()
  runner.enterContext(new Context('root'))
  runner.enterContext(new Context('leaf'))

  t.is(runner.context.name, 'leaf')
  t.is(runner.contextPath, 'root » leaf')

  runner.leaveContext()

  t.is(runner.context.name, 'root')
})

test('get headers from context stack', t => {
  const runner = new Runner()
  runner.enterContext(new Context('root'))
  runner.context.setHeader('X-Api-Version', '3.0')
  runner.context.setHeader('X-Api-Key', 'root-api-key')

  runner.enterContext(new Context('leaf'))
  runner.context.setHeader('X-Api-Key', 'leaf-api-key')

  t.is(runner.getHeaders()['X-Api-Version'], '3.0')
  t.is(runner.getHeaders()['X-Api-Key'], 'leaf-api-key')

  runner.leaveContext() // leave leaf context
  t.is(runner.getHeaders()['X-Api-Version'], '3.0')
  t.is(runner.getHeaders()['X-Api-Key'], 'root-api-key')
})

test('overrideKeys with object', t => {
  const runner = new Runner()
  const result = runner.overrideKeys({ user: { name: 'Old', age: 20, developer: false }}, { name: 'New', age: 30, developer: true })
  t.is(result.user.name, 'New')
  t.is(result.user.age, 30)
  t.is(result.user.developer, true)
})

test('overrideKeys with boolean source', t => {
  const runner = new Runner()
  const result = runner.overrideKeys({ flags: { left: true, center: true, right: true } }, { left: 'false', center: 0, right: '0' })
  t.is(result.flags.left, false)
  t.is(result.flags.center, false)
  t.is(result.flags.right, false)
})

test('overrideKeys with array', t => {
  const runner = new Runner()
  const result = runner.overrideKeys({ items: [{ body: 'String' }] }, {})
  t.assert(Array.isArray(result.items))
})

test('overrideKeys with nested array', t => {
  const runner = new Runner()
  const result = runner.overrideKeys({ event: { name: 'Event', items: [{ body: 'String' }] } }, {})
  t.assert(Array.isArray(result.event.items))
})