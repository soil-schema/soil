import test from 'ava'
import { default as Tokenizer, tokenize, offsetToPosition, makeLineMap } from '../../src/parser/Tokenizer.js'

const FILE_PATH = '/tmp/test.soil'

const emurateTokenize = (body) => tokenize.call(new Tokenizer(FILE_PATH), body)

test('offsetToPosition', t => {
  const file1 = `first line
second line`
  t.deepEqual(offsetToPosition(0, makeLineMap(file1)), { line: 1, column: 1 })
  t.deepEqual(offsetToPosition(1, makeLineMap(file1)), { line: 1, column: 2 })
  t.deepEqual(offsetToPosition(11, makeLineMap(file1)), { line: 2, column: 1 })
})

test('tokenize: blank entity', t => {
  const tokens = emurateTokenize('entity BlankEntity {}')
  t.deepEqual(tokens.map(token => token.value), ['entity', 'BlankEntity', '{', '}'])
})

test('tokenize: entity has one string field', t => {
  const tokens = emurateTokenize('entity Person {field name: String}')
  t.deepEqual(tokens.map(token => token.value), ['entity', 'Person', '{', 'field', 'name', ':', 'String', '}'])
})

test('tokenize: entity has one endpoint', t => {
  const tokens = emurateTokenize('entity Person { endpoint GET /person {} }')
  t.deepEqual(tokens.map(token => token.value), ['entity', 'Person', '{', 'endpoint', 'GET', '/person', '{', '}', '}'])
})

test('tokenize: comment and description entity', t => {
  const tokens = emurateTokenize(`
- Comment line

# Summary
#
# Description
entity BlankEntity {}
`)
  t.deepEqual(tokens.map(token => token.value), [
    '- Comment line',
    '# Summary',
    '#', 
    '# Description',
    'entity', 'BlankEntity', '{', '}',
  ])
})

test('comment and description entity', t => {
  const body = `
- Comment line

# Summary
#
# Description
entity BlankEntity {}
`
  const result = new Tokenizer(FILE_PATH, body).parse()
  t.fail(result)
})

test('complete case', t => {
  const body = `
- This is complete case mock

# Person summary
#
# Additional description for person
entity Person {
  field id: Int
  mutable field name: String

  endpoint GET /persons {
    name list
    success {
      field persons: List<Person>
    }
  }

  endpoint GET /persons/$id {
    name find
    parameter id: Person.id
    success {
      field person: Person
    }
  }

  endpoint POST /persons {
    name register
    request {
      field person: Person
    }
    success {
      field person: Person
    }
  }

  endpoint GET /persons/search {
    name search
    query q: String
    success {
      field persons: List<Person>
    }
  }
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
  const result = new Tokenizer(FILE_PATH, body).tokenize()
  //console.dir(new Parser().parse(result), { depth: 10 })
  t.fail(result)
})
