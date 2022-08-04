import test from 'ava'
import Response from '../src/graph/Response.js'
import Entity from '../src/graph/Entity.js'
import UnsupportedKeywordError from '../src/errors/UnsupportedKeywordError.js'

import { configTemplate } from '../src/utils.js'
import contextUtilities from '../src/context.js'

const context = {
  config: configTemplate.build({}),
  ...contextUtilities,
}

test('assert with simple entity', t => {
  const person = new Entity({
    name: 'Person',
    fields: {
      id: {
        type: 'Integer'
      },
      name: {
        type: 'String',
      },
    },
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
  const request = new Response('mime:application/json')
  t.is(request.renderSwiftStruct(context), 'public typealias Response = Data')
})

test('[Swift] with configured mime-type', t => {
  const request = new Response('mime:video/mp2t')
  t.is(request.renderSwiftStruct({ ...context, config: { ...context.config, swift: { ...context.config.swift, mime: { 'video/mp2t': 'Video' } } } }), 'public typealias Response = Video')
})

test('[Swift] with unsupported mime-type', t => {
  const request = new Response('mime:audio/webm')
  t.throws(() => {
    request.renderSwiftStruct(context)
  }, { instanceOf: UnsupportedKeywordError })
})