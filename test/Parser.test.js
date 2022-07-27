import { promises as fs } from 'fs'
import YAML from 'yaml'

import test from 'ava'
import Parser from '../src/parser/Parser.js'

test('parse empty entity', async (t) => {
  const schema = 'entity Article {}'
  const parser = new Parser('test.soil', schema)
  const result = parser.parse()

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
})

test('parse an entity with one line field', async (t) => {
  const schema = `
entity Article {
  field title: String
}`
const parser = new Parser('test.soil', schema)
const result = parser.parse()

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.assert(result[0].fields.title)
})

test('parse an entity with blocked field', async (t) => {
  const schema = `
entity Article {
  field title: String {
    - This is a summary
  }
}`
  const parser = new Parser('test.soil', schema)
  const result = parser.parse()

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.is(result[0].fields.title.summary, 'This is a summary')
})

test('parse an entity with mutable field', async (t) => {
  const schema = `
entity Article {
  mutable field title: String
}`
const parser = new Parser('test.soil', schema)
const result = parser.parse()

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.is(result[0].fields.title.annotation, 'mutable')
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
  const parser = new Parser('test.soil', schema)
  const result = parser.parse()

  t.is(result.length, 1)
  t.is(result[0].name, 'Article')
  t.assert(result[0].endpoints['/articles'].get)
  t.is(result[0].endpoints['/articles'].get.summary, 'List Articles')
  t.is(result[0].endpoints['/articles'].get.success.schema.articles.type, 'List<Article>')
})

// tokenize

test('tokenize basic entity', t => {
  const body = `
entity User {
  mutable field name: String
  writer field email: String {
    - Email Address
  }
  writer field password: String {
    - Password
  }
}
`
  const parser = new Parser('test.soil', body)
  t.snapshot(parser.tokenize())
})

test('tokenize parameterized endpoint path', t => {
  const body = `
entity Sample {
  endpoint GET /sample/$id {}
}
`
  const parser = new Parser('test.soil', body)
  t.is(parser.tokenize().map(token => token.token).indexOf('/sample/$id'), 5)
})