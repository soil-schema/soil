import test from 'ava'
import Response from '../src/graph/Response.js'
import UnsupportedKeywordError from '../src/errors/UnsupportedKeywordError.js'

import { DEFAULT_CONFIG } from '../src/const.js'
import contextUtilities from '../src/context.js'

const context = {
  config: DEFAULT_CONFIG,
  ...contextUtilities,
}

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