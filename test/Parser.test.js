import { promises as fs } from 'fs'
import YAML from 'yaml'

import test from 'ava'
import Parser from '../src/parser/Parser.js'
import Entity from '../src/models/Entity.js'

test('parse empty entity', async (t) => {
  const schema = 'entity Article {}'
  const parser = new Parser()

  const result = parser.parse(schema)

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.assert(result[0] instanceof Entity)
})

test('parse an entity with one line field', async (t) => {
  const schema = `
entity Article {
  field title: String
}`
  const parser = new Parser()

  const result = parser.parse(schema)

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.assert(result[0] instanceof Entity)
  t.is(result[0].fields.length, 1)
})

test('parse an entity with blocked field', async (t) => {
  const schema = `
entity Article {
  field title: String {
    - This is a summary
  }
}`
  const parser = new Parser()

  const result = parser.parse(schema)

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.assert(result[0] instanceof Entity)
  t.is(result[0].fields.length, 1)
  t.is(result[0].fields[0].summary, 'This is a summary')
})

test('parse an entity with mutable field', async (t) => {
  const schema = `
entity Article {
  mutable field title: String
}`
  const parser = new Parser()

  const result = parser.parse(schema)

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.assert(result[0] instanceof Entity)
  t.is(result[0].fields.length, 1)
  t.is(result[0].fields[0].mutable, true)
})

test('parse an entity with get endpoint', async (t) => {
  const schema = `
entity Article {
  field title: String
  endpoint GET /articles {
    - List Articles
    success {
      field articles: List<Article>
    }
  }
}`
  const parser = new Parser()

  const result = parser.parse(schema)

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.assert(result[0] instanceof Entity)
  t.is(result[0].endpoints.length, 1)
  t.is(result[0].endpoints[0].summary, 'List Articles Endpoint')
  t.is(result[0].endpoints[0].successResponse.schema.articles.type, 'List<Article>')
})
