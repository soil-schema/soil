import test from 'ava'
import Response from '../src/graph/Response.js'
import Entity from '../src/graph/Entity.js'
import UnsupportedKeywordError from '../src/errors/UnsupportedKeywordError.js'

import { applyDefaults } from '../src/config/load.js'
import contextUtilities from '../src/context.js'

const context = {
  config: applyDefaults({}),
  ...contextUtilities,
}

test('assert with simple entity', t => {
  const person = new Entity({
    name: 'Person',
    fields: [
      {
        name: 'id',
        type: 'Integer'
      },
      {
        name: 'name',
        type: 'String',
      },
    ],
  })
  t.assert(person.assert({
    id: 0,
    name: 'niaeashes',
  }))
  t.assert(person.assert({
    id: 0,
    name: 'nobody',
    additional_field: true,
  }))
  t.not(person.assert({
    id: 0,
    name: 100,
  }))
})

import '../src/swift.js'

test('[Swift] with supported mime-type', t => {
  const response = new Response('mime:application/json')
  const config = {
    ...context.config,
  }
  Object.defineProperty(response, 'config', { value: config })
  t.is(response.swift_Struct(context), 'public typealias Response = Data')
})

test('[Swift] with configured mime-type', t => {
  const response = new Response('mime:video/mp2t')
  const config = {
    ...context.config,
    api: { ...context.config.api, mime: { 'video/mp2t': 'Video' } },
  }
  Object.defineProperty(response, 'config', { value: config })
  t.is(response.swift_Struct({ ...context, config: { ...context.config, swift: { ...context.config.swift, mime: { 'video/mp2t': 'Video' } } } }), 'public typealias Response = Video')
})

test('[Swift] with unsupported mime-type', t => {
  const response = new Response('mime:audio/webm')
  const config = {
    ...context.config,
  }
  Object.defineProperty(response, 'config', { value: config })
  t.throws(() => {
    response.swift_Struct(context)
  }, { instanceOf: UnsupportedKeywordError })
})