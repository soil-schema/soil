import test from 'ava'
import Tokenizer from '../../src/parser/Tokenizer.js'
import Parser from '../../src/parser/Parser.js'

const FILE_PATH = '/tmp/test.soil'

test('blank entity', t => {
  const result = new Parser().parse(new Tokenizer(FILE_PATH, 'entity BlankEntity {}').tokenize())
  t.is(result.length, 1)
})

test('entity has one field', t => {
  const result = new Parser().parse(new Tokenizer(FILE_PATH, 'entity Person { field name: String }').tokenize())
  t.is(result.length, 1)
})

test('scenario has annotated fields', t => {
  const body = `
# Person entity for test
entity Person {
  field id: Int
  mutable field name: String
  writer field photo_id: Int
}`
  const tokens = new Tokenizer(FILE_PATH, body).tokenize()
  const result = new Parser().parse(tokens)
  tokens.forEach(token => t.not(token.errors.length))
  t.is(result.length, 1)
})

test('entity has one endpoint', t => {
  const result = new Parser().parse(new Tokenizer(FILE_PATH, 'entity Person { endpoint GET /person {} }').tokenize())
  t.is(result.length, 1)
})

test('entity has one named endpoint', t => {
  const body = `
# Person entity for test
entity Person {
  field id: Int
  # Endpoint summary
  endpoint GET /person/$id {
    name find
  }
}`
  const tokens = new Tokenizer(FILE_PATH, body).tokenize()
  const result = new Parser().parse(tokens)
  t.is(result.length, 1)
  tokens.forEach(token => t.not(token.errors.length))
})

test('entity has one parameterized endpoint', t => {
  const body = `
# Person entity for test
entity Person {
  field id: Int
  # Endpoint summary
  endpoint GET /groups/$group_id/persons {
    parameter group_id: Group.id
  }
}`
  const tokens = new Tokenizer(FILE_PATH, body).tokenize()
  const result = new Parser().parse(tokens)
  t.is(result.length, 1)
  tokens.forEach(token => t.not(token.errors.length))
})

test('entity has one query endpoint', t => {
  const body = `
# Person entity for test
entity Person {
  field id: Int
  # Endpoint summary
  endpoint GET /persons/search {
    required query q: String
  }
}`
  const tokens = new Tokenizer(FILE_PATH, body).tokenize()
  const result = new Parser().parse(tokens)
  t.is(result.length, 1)
  tokens.forEach(token => t.not(token.errors.length))
})

test('scenario has one inner entity', t => {
  const body = `
# Person entity for test
entity Person {
  field id: Int
  field records: List<Record>
  inner Record {
    field timestamp: Timestamp
    field body: String
  }
}`
  const tokens = new Tokenizer(FILE_PATH, body).tokenize()
  const result = new Parser().parse(tokens)
  tokens.forEach(token => t.not(token.errors.length))
  t.is(result.length, 1)
})

test('scenario has subschema field', t => {
  const body = `
# Person entity for test
entity Person {
  field id: Int
  field records: List<*> {
    schema {
      field timestamp: Timestamp
      field body: String
    }
  }
}`
  const tokens = new Tokenizer(FILE_PATH, body).tokenize()
  const result = new Parser().parse(tokens)
  tokens.forEach(token => t.not(token.errors.length))
  t.is(result.length, 1)
})

test('scenario has one command', t => {
  const tokens = new Tokenizer(FILE_PATH, 'scenario Register Person { @inspect }').tokenize()
  const result = new Parser().parse(tokens)
  tokens.forEach(token => t.not(token.errors.length))
  t.is(result.length, 1)
})

test('scenario', t => {
  const body = `
shared scenario Prepare {
  - Do something
}
# "Register Person" scenario summary
#
# Additional description for this scenario
scenario Register Person {
  @inspect
  @set-var name, value
  @set-var(name, value)
  POST /persons {
    name = Dante Alighieri
    after {
      @set-var id, $response.person.id
    }
  }
  POST /persons {
    name = "Beatrice"
    after {
      @set-var id, $response.person.id
    }
  }
  GET /persons/$id
  Person.search {
    - GET /persons/search
    q = Dante
  }
}
`
  const tokens = new Tokenizer(FILE_PATH, body).tokenize()
  const result = new Parser().parse(tokens)
  tokens.forEach(token => t.not(token.errors.length))
  t.is(result.length, 2)
})
