import test from "ava"
import Endpoint from "../src/graph/Endpoint.js"
import Field from "../src/graph/Field.js"

import { configTemplate } from '../src/utils.js'
import contextUtilities from '../src/context.js'
import Parameter from "../src/graph/Parameter.js"

const context = {
  config: configTemplate.build({}),
  ...contextUtilities,
}

test('get endpoint', t => {
  const getEndpoint = new Endpoint({ path: '/users', method: 'get' })
  t.is(getEndpoint.signature, 'UsersEndpoint')
})

test('get endpoint with summary', t => {
  const getEndpoint = new Endpoint({ path: '/users', method: 'get', summary: 'List Users' })
  t.is(getEndpoint.signature, 'ListUsersEndpoint')
})

test('get endpoint with parameter', t => {
  const getEndpoint = new Endpoint({ path: '/users/{id}', method: 'get' })
  t.is(getEndpoint.signature, 'UsersIdEndpoint')
  t.is(getEndpoint.resolvePathParameters(context).length, 1)
})

test('get endpoint with summary and parameter', t => {
  const getEndpoint = new Endpoint({ path: '/users/{id}', method: 'get', summary: 'Get User' })
  t.is(getEndpoint.signature, 'GetUserEndpoint')
})

test('get endpoint with path parameter', t => {
  const getEndpoint = new Endpoint({ path: '/users/$id', method: 'get' })
  t.is(getEndpoint.signature, 'UsersIdEndpoint')
  t.is(getEndpoint.resolvePathParameters(context).length, 1)
  t.assert(getEndpoint.resolvePathParameters(context)[0] instanceof Parameter)
})

test('get endpoint with path parameter and parameters schema', t => {
  const getEndpoint = new Endpoint({ path: '/users/$id', method: 'get', parameters: { id: 'String' } })
  t.is(getEndpoint.signature, 'UsersIdEndpoint')
  t.is(getEndpoint.resolvePathParameters(context).length, 1)
  t.assert(getEndpoint.resolvePathParameters(context)[0] instanceof Parameter)
})

test('match static path', t => {
  t.assert(new Endpoint({ path: '/users', method: 'get' }).match('get', '/users'))
})

test('not match static path', t => {
  t.not(new Endpoint({ path: '/users', method: 'get' }).match('get', '/authors'))
})

test('match with integer path parameter', t => {
  t.assert(new Endpoint({ path: '/users/$id', method: 'get', parameters: { id: 'Integer' } }).match('get', '/users/10'))
})

test('not match with integer path parameter', t => {
  t.not(new Endpoint({ path: '/users/$id', method: 'get', parameters: { id: 'Integer' } }).match('get', '/users/code'))
})