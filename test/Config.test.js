import test from 'ava'
import Config, { InvalidConfigError } from '../src/Config.js'

test('string array', t => {
  const parser = new Config()
    .addDirective('swift', swift => {
      swift
        .stringArray('use')
    })
  t.deepEqual(parser.build({ swift: { use: 'item' } }).swift.use, ['item'])
  t.deepEqual(parser.build({ swift: { use: ['item'] } }).swift.use, ['item'])
  t.throws(() => {
    parser.build({ swift: { use: 10 } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.use\b/ })
  t.throws(() => {
    parser.build({ swift: { use: {} } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.use\b/ })
  t.throws(() => {
    parser.build({ swift: { use: [10] } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.use\b/ })
  t.throws(() => {
    parser.build({ swift: { use: true } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.use\b/ })
})

test('string', t => {
  const parser = new Config()
    .addDirective('swift', swift => {
      swift
        .string('indent', '  ')
    })
  t.is(parser.build({ swift: { indent: '    ' } }).swift.indent, '    ')
  t.is(parser.build({ swift: { indent: undefined } }).swift.indent, '  ')
  t.is(parser.build({ swift: {} }).swift.indent, '  ')
  t.throws(() => {
    parser.build({ swift: { indent: 10 } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.indent\b/ })
  t.throws(() => {
    parser.build({ swift: { indent: {} } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.indent\b/ })
  t.throws(() => {
    parser.build({ swift: { indent: [10] } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.indent\b/ })
  t.throws(() => {
    parser.build({ swift: { indent: true } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.indent\b/ })
})

test('string table', t => {
  const parser = new Config()
    .addDirective('swift', swift => {
      swift
        .stringTable('protocols', {
          entity: 'Encodable',
          writer: 'Decodable',
          endpoint: undefined,
        })
    })
  t.is(parser.build({ swift: { protocols: { entity: 'Entity' } } }).swift.protocols.entity, 'Entity')
  t.is(parser.build({ swift: { protocols: { entity: 'Entity' } } }).swift.protocols.writer, 'Decodable')
  t.is(parser.build({ swift: { protocols: { entity: 'Entity' } } }).swift.protocols.endpoint, undefined)
  t.throws(() => {
    parser.build({ swift: { protocols: 10 } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.protocols\b/ })
  t.notThrows(() => {
    parser.build({ swift: { protocols: {} } })
  })
  t.throws(() => {
    parser.build({ swift: { protocols: [10] } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.protocols\b/ })
  t.throws(() => {
    parser.build({ swift: { protocols: true } })
  }, { instanceOf: InvalidConfigError, message: /\bswift\.protocols\b/ })
})

test('integer', t => {
  const parser = new Config()
    .addDirective('sample', sample => {
      sample
        .integer('number', 100)
    })
  t.deepEqual(parser.build({ sample: { number: 200 } }).sample.number, 200)
  t.deepEqual(parser.build({ sample: { number: undefined } }).sample.number, 100)
  t.throws(() => {
    parser.build({ sample: { number: 'string' } })
  }, { instanceOf: InvalidConfigError, message: /\bsample\.number\b/ })
  t.throws(() => {
    parser.build({ sample: { number: true } })
  }, { instanceOf: InvalidConfigError, message: /\bsample\.number\b/ })
  t.throws(() => {
    parser.build({ sample: { number: {} } })
  }, { instanceOf: InvalidConfigError, message: /\bsample\.number\b/ })
  t.throws(() => {
    parser.build({ sample: { number: 10.2 } })
  }, { instanceOf: InvalidConfigError, message: /\bsample\.number\b/ })
})
