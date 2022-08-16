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
  const request = new RequestBody({ mime: 'mime:application/json' })
  Object.defineProperty(request, 'config', { value: context.config })
  t.is(request.swift_Struct(context), 'public typealias RequestBody = Data')
})

test('[Swift] with configured mime-type', t => {
  const request = new RequestBody({ mime: 'mime:video/mp2t' })
  const config = {
    ...context.config,
    swift: { ...context.config.swift, mime: { 'video/mp2t': 'Video' } },
  }
  Object.defineProperty(request, 'config', { value: config })
  t.is(request.swift_Struct(context), 'public typealias RequestBody = Video')
})

test('[Swift] with unsupported mime-type', t => {
  const request = new RequestBody({ mime: 'mime:audio/webm' })
  Object.defineProperty(request, 'config', { value: context.config })
  t.throws(() => {
    request.swift_Struct(context)
  }, { instanceOf: UnsupportedKeywordError })
})