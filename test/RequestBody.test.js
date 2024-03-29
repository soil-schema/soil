import test from 'ava'
import RequestBody from '../src/graph/RequestBody.js'
import UnsupportedKeywordError from '../src/errors/UnsupportedKeywordError.js'

import { applyDefaults } from '../src/config/load.js'
import contextUtilities from '../src/context.js'

const context = {
  config: applyDefaults({}),
  ...contextUtilities,
}

import '../src/generator/swift.js'

test('[Swift] with supported mime-type', t => {
  const request = new RequestBody({ mime: 'mime:application/json' })
  Object.defineProperty(request, 'config', { value: context.config })
  t.is(request.swift_Struct(context), 'public var body: Data')
})

test('[Swift] with configured mime-type', t => {
  const request = new RequestBody({ mime: 'mime:video/mp2t' })
  const config = {
    ...context.config,
    api: { ...context.config.api, mime: { 'video/mp2t': 'Video' } },
  }
  Object.defineProperty(request, 'config', { value: config })
  t.is(request.swift_Struct(context), 'public var body: Video')
})

test('[Swift] with unsupported mime-type', t => {
  const request = new RequestBody({ mime: 'mime:audio/webm' })
  Object.defineProperty(request, 'config', { value: context.config })
  t.throws(() => {
    request.swift_Struct(context)
  }, { instanceOf: UnsupportedKeywordError })
})