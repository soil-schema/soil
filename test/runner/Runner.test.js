import test from 'ava'
import Runner from '../../src/runner/Runner.js'
import Context from '../../src/runner/Context.js'
import ScenarioRuntimeError from '../../src/errors/ScenarioRuntimeError.js'
import Root from '../../src/graph/Root.js'
import Scenario from '../../src/graph/Scenario.js'

test('set and resolve var', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.command_set('name', 'value')
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
  runner.command_set('person', { name: 'value' })
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

/**
 * @set-header command
 */

 test('@set-header', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.command_set_header('X-Test', 'Testing header value')
  const headers = runner.context.applyHeaders({})
  t.is(headers['X-Test'], 'Testing header value')
})

/**
 * @set-secure-header command
 */

 test('@set-secure-header', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.command_set_secure_header('X-Secure-Test', 'Testing header value')
  const headers = runner.context.applyHeaders({})
  t.is(headers['X-Secure-Test'], 'Testing header value')
})

/**
 * @set-local command
 */

 test('@set-local', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.command_set_local('test', 'Testing value')
  t.is(runner.context.getVar('$test'), 'Testing value')
})

/**
 * @set command
 */

 test('@set', t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  runner.command_set('test', 'Testing value')
  t.is(runner.context.getVar('$test'), 'Testing value')
})

/**
 * @export-json command
 */

 test('@export-json', async t => {
  const runner = new Runner()

  // Planned 2 assertion on writeFile mock method
  t.plan(2)

  // Mock file system module via Framework
  runner.framework.mock('fs', {
    writeFile: (filepath, content, options) => {
      t.is(filepath, './tmp/export.json')
      t.deepEqual(JSON.parse(content), { name: 'Test' })
    },
  })

  runner.enterContext(new Context('test'))
  runner.runCommand('set', 'test', { name: 'Test' })
  await runner.runCommand('export_json', '$test', './tmp/export.json')
})

test('@export-json with undefined', async t => {
  const runner = new Runner()

  // Mock file system module via Framework
  runner.framework.mock('fs', {
    writeFile: (filepath, content, options) => {
      t.fail('expect never calling writeFile method on Framework')
    },
  })

  runner.enterContext(new Context('test'))
  // Note: $test context variable is not defined.
  await runner.runCommand('export_json', '$test', './tmp/export.json')

  t.pass() // No assertion
})

/**
 * @import-json command
 */

test('@import-json', async t => {
  // @import-json command uses core.encoding config.
  const runner = new Runner({ core: { encoding: 'utf-8' } })

  t.plan(2)

  // Mock file system module via Framework
  runner.framework.mock('fs', {
    readFile: (filepath, options) => {
      t.is(filepath, './fixtures/import.json')
      return JSON.stringify({ name: 'Test' })
    },
  })

  runner.enterContext(new Context('test'))
  await runner.runCommand('import_json', '$test', './fixtures/import.json')

  t.deepEqual(runner.getVar('$test'), { name: 'Test' })

})

/**
 * @inspect command
 */

/**
 * Test only that some logs are recorded.
 * It does not test whether the contents of logs are useful.
 */
test('@inspect records logs', t => {
  const runner = new Runner()
  t.is(runner.logs.length, 0)
  runner.runCommand('inspect')
  t.assert(runner.logs.length > 0)
})

/**
 * @use command
 */

 test('@use', async t => {
  const root = new Root()
  root.addChild(new Scenario({
    name: 'Shared Scenario',
    steps: [
      { command: 'set', args: ['test', 'value'] },
    ],
  }))
  const runner = new Runner({}, root)
  runner.enterContext(new Context('test'))
  await runner.runCommand('use', 'Shared Scenario')
  t.is(runner.context.getVar('$test'), 'value')
})

 test('@use when scenario is not found (undefined root)', async t => {
  const runner = new Runner()
  runner.enterContext(new Context('test'))
  await t.throwsAsync(async () => {
    await runner.runCommand('use', 'Unknown Scenario')
  }, { instanceOf: ScenarioRuntimeError })
})