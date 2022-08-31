import test from 'ava'
import Root from '../../src/graph/Root.js'
import { UserEntity } from './factory.js'
import Scenario from '../../src/graph/Scenario.js'

test('entityPath', t => {
  const root = new Root()
  t.is(root.entityPath, void 0)
})

test('entities', t => {
  {
    const root = new Root()
    t.deepEqual(root.entities, [])
  }
  {
    const root = new Root()
    root.addChild(UserEntity)
    t.is(root.entities.length, 1)
  }
})

test('endpoints', t => {
  const root = new Root()
  root.addChild(UserEntity)
  t.is(root.endpoints.length, UserEntity.endpoints.length)
})

test('scenarios', t => {
  {
    const root = new Root()
    t.deepEqual(root.scenarios, [])
  }
  {
    const root = new Root()
    root.addChild(new Scenario({
      name: 'Fetch User',
    }))
    t.is(root.scenarios.length, 1)
  }
})

test('findEndpoint', t => {
  const root = new Root()
  root.addChild(UserEntity)
  t.assert(root.findEndpoint('GET', '/users'))
  t.assert(root.findEndpoint('POST', '/users') === void 0)
  t.assert(root.findEndpoint('GET', '/users/10'))
  t.assert(root.findEndpoint('GET', '/users/invalid') === void 0)
})

test('findScenario', t => {
  const root = new Root()
  root.addChild(new Scenario({
    name: 'Fetch User',
  }))
  t.assert(root.findScenario('Fetch User'))
  t.assert(root.findScenario('Not Found Scenario') === void 0)
})

test('resolve endpoint', t => {
  t.plan(3)
  const checker = Math.random()
  const root = new Root()
  root.findEndpoint = (method, path) => {
    t.is(method, 'GET')
    t.is(path, '/users')
    return checker
  }
  root.__Node_resolve = (referenceBody) => {
    t.fail()
  }
  t.is(root.resolve('GET /users'), checker)
})

test('resolve delegate', t => {
  t.plan(2)
  const checker = Math.random()
  const root = new Root()
  root.findEndpoint = (method, path) => {
    t.fail()
  }
  root.__Node_resolve = (referenceBody) => {
    t.is(referenceBody, 'User')
    return checker
  }
  t.is(root.resolve('User'), checker)
})
