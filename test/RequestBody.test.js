import test from 'ava'
import RequestBody from '../src/graph/RequestBody.js'
import UnsupportedKeywordError from '../src/errors/UnsupportedKeywordError.js'

import { configTemplate } from '../src/utils.js'
import contextUtilities from '../src/context.js'

const context = {
  config: configTemplate.build({}),
  ...contextUtilities,
}

import '../src/swift.js'

test('[Swift] with supported mime-type', t => {
  const request = new RequestBody('mime:application/json')
  t.is(request.swift_Struct(context), 'public typealias RequestBody = Data')
})

test('[Swift] with configured mime-type', t => {
  const request = new RequestBody('mime:video/mp2t')
  t.is(request.swift_Struct({ ...context, config: { ...context.config, swift: { ...context.config.swift, mime: { 'video/mp2t': 'Video' } } } }), 'public typealias RequestBody = Video')
})

test('[Swift] with unsupported mime-type', t => {
  const request = new RequestBody('mime:audio/webm')
  t.throws(() => {
    request.swift_Struct(context)
  }, { instanceOf: UnsupportedKeywordError })
})