import test from 'ava'
import { config, blocks } from './recipes.loader.js'

import Schema from '../src/graph/Schema.js'
import Tokenizer from '../src/parser/Tokenizer.js'
import Parser from '../src/parser/Parser.js'

const runner = async t => {
  /*
   * Ava provide test title
   * @see https://github.com/avajs/ava/blob/main/lib/test.js#L162
   */
  const name = t.title

  const block = blocks[name]

  const schema = new Schema(config)
  const result = new Parser().parse(new Tokenizer(block.uri, block.soil).tokenize())

  schema.parse(result)

  t.assert(schema.entities.length >= 1, 'Single recipe requires single or more entity directives.')

  const entity = schema.entities[0]

  const swift = await entity.renderSwiftFile({ config, entities: schema.entities })

  if ('swift' in block) {
    t.is(block.swift.trim(), swift.trim())
  } else {
    t.fail(`Swift expectation not found:\r\n${swift}`)
  }

  const mock = JSON.stringify(entity.mock(), null, 2)

  if ('mock' in block) {
    t.is(block.mock.trim(), mock.trim())
  } else {
    t.fail(`JSON mock expectation not found:\r\n${mock}`)
  }

  t.pass()
}

/**
 * Supports tests at specific line number
 * @see https://github.com/avajs/ava/blob/main/docs/05-command-line.md#running-tests-at-specific-line-numbers
 */

test('User Entity', runner)

test('User Endpoints', runner)

test('Primitive Types', runner)

test('Self Defined Type', runner)

test('Reference Type', runner)
