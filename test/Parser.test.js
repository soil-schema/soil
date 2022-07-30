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
  t.snapshot(result)
})

test('parse summary and description', async (t) => {
  const schema = `
entity Note {
  - Note Summary
  - Note Description 1
  - Note Description 2
  field title: String {
    - Title Summary
    - Title Description 1
    - Title Description 2
  }
}`
  const parser = new Parser('test.soil', schema)
  const result = parser.parse()

  t.is(result.length, 1)
  t.is(result[0].name, 'Note')
  t.is(result[0].summary, 'Note Summary')
  t.snapshot(result)
})

test('parse endpoint request with mime-type', t => {
  const schema = `
entity UserImage {
  endpoint POST /user_images {
    request mime:image/jpeg
  }
}`
  const parser = new Parser('test.soil', schema)
  const result = parser.parse()

  t.is(result.length, 1)
  t.is(result[0].endpoints['/user_images'].post.request, 'mime:image/jpeg')
  t.snapshot(result)
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

test('tokenize inner type', t => {
  const body = `
entity Order {
  mutable field item: List<Item>
  inner Item {
    field name: String
  }
}
`
  const parser = new Parser('test.soil', body)
  t.snapshot(parser.tokenize())
})

test('tokenize endpoint with path parameter', t => {
  const body = `
entity Sample {
  endpoint GET /sample/$id {}
}
`
  const parser = new Parser('test.soil', body)
  const result = parser.tokenize()
  t.is(result.map(token => token.token).indexOf('/sample/$id'), 5)
  t.snapshot(result)
})

test('tokenize endpoint with path parameter directive', t => {
  const body = `
entity Sample {
  endpoint GET /sample/$id {
    parameter id: Integer {
      - Parameter Summary
    }
  }
}
`
  const parser = new Parser('test.soil', body)
  const result = parser.tokenize()
  t.is(result.map(token => token.token).indexOf('/sample/$id'), 5)
  t.snapshot(result)
})

test('tokenize endpoint with query parameter directive', t => {
  const body = `
entity Sample {
  endpoint GET /sample/search {
    query q: String {
      - Query Summary
    }
  }
}
`
  const parser = new Parser('test.soil', body)
  const result = parser.tokenize()
  t.is(result.map(token => token.token).indexOf('/sample/search'), 5)
  t.snapshot(result)
})