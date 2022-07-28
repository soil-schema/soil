import test from 'ava'
import RequestBody from '../src/graph/RequestBody.js'
import UnsupportedKeywordError from '../src/errors/UnsupportedKeywordError.js'

import { DEFAULT_CONFIG } from '../src/const.js'
import contextUtilities from '../src/context.js'

const context = {
  config: DEFAULT_CONFIG,
  ...contextUtilities,
}

import '../src/swift.js'

test('[Swift] with supported mime-type', t => {
  const request = new RequestBody('mime:application/json')
  t.is(request.renderSwiftStruct(context), 'public typealias RequestBody = Data')
})

test('[Swift] with configured mime-type', t => {
  const request = new RequestBody('mime:video/mp2t')
  t.is(request.renderSwiftStruct({ ...context, config: { ...context.config, swift: { ...context.config.swift, mime: { 'video/mp2t': 'Video' } } } }), 'public typealias RequestBody = Video')
})

test('[Swift] with unsupported mime-type', t => {
  const request = new RequestBody('mime:audio/webm')
  t.throws(() => {
    request.renderSwiftStruct(context)
  }, { instanceOf: UnsupportedKeywordError })
})