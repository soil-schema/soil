import test from 'ava'
import Endpoint from '../../src/graph/Endpoint.js'
import { buildTestEndpoint, ConfigInjector } from './factory.js'

test('Named Endpoint', t => {
  const target = new Endpoint({
    method: 'GET',
    path: '/test',
    name: 'test',
  })

  t.is(target.signature, 'TestEndpoint')
  t.not(target.hasResponse)
})

test('with ignore-coverage flag', t => {
  const target = new Endpoint({
    method: 'GET',
    path: '/test',
    'ignore-coverage': true,
  })

  t.assert(target.ignoreCoverage)
})

test('.reportSignature', t => {
  const target = new Endpoint({
    method: 'GET',
    path: '/test',
    name: 'test',
  })

  t.is(target.reportSignature, 'GET /test - test')
})

test('.buildQueryString with String query', t => {
  const target = new Endpoint({
    method: 'GET',
    path: '/test',
    name: 'test',
    query: [
      { name: 'q', type: 'String' },
    ],
  })
  t.is(target.buildQueryString(() => 'value'), '?q=value')
})

test('.buildQueryString with Boolean query and true value', t => {
  const queryProvider = () => true
  const tester = {
    'numeric': '?flag=1',
    'stringify': '?flag=true',
    'set-only-true': '?flag=1',
    'only-key': '?flag',
  }
  Object.entries(tester).forEach(([ booleanQuery, expected ]) => {
    const target = buildTestEndpoint(schema => {
      schema.query.push({ name: 'flag', type: 'Boolean' })
    })
    target.moveToParent(new ConfigInjector().inject({
      api: { booleanQuery }
    }))
    t.is(target.buildQueryString(queryProvider), expected)
  })
})

test('.buildQueryString with Boolean query and false value', t => {
  const queryProvider = () => false
  const tester = {
    'numeric': '?flag=0',
    'stringify': '?flag=false',
    'set-only-true': '',
    'only-key': '',
  }
  Object.entries(tester).forEach(([ booleanQuery, expected ]) => {
    const target = buildTestEndpoint(schema => {
      schema.query.push({ name: 'flag', type: 'Boolean' })
    })
    target.moveToParent(new ConfigInjector().inject({
      api: { booleanQuery }
    }))
    t.is(target.buildQueryString(queryProvider), expected)
  })
})

test('.score', t => {
  const search = new Endpoint({
    method: 'GET',
    path: '/resources/search',
  })
  const fetchSingle = new Endpoint({
    method: 'GET',
    path: '/resources/$id',
    parameters: [
      { name: 'id', type: 'Integer' },
    ],
  })
  t.assert(search.score('GET', '/resources/search') > fetchSingle.score('GET', '/resources/search'))
  t.assert(search.score('GET', '/resources/10') < fetchSingle.score('GET', '/resources/10'))
  t.assert(search.score('GET', '/resources/$id') < fetchSingle.score('GET', '/resources/$id'))

  const filter = new Endpoint({
    method: 'GET',
    path: '/resources/$filter',
    parameters: [
      { name: 'filter', type: 'Enum', enum: ['metal', 'carbon'] },
    ],
  })
  t.assert(filter.score('GET', '/resources/metal') > fetchSingle.score('GET', '/resources/metal'))
  t.assert(filter.score('GET', '/resources/10') < fetchSingle.score('GET', '/resources/10'))
})