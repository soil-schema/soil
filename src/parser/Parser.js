import SyntaxError from '../errors/SyntaxError.js'
import Token from './Token.js'

/**
 * 
 * @param {Token[]} tokens 
 * @returns {Token[]}
 */
export const stripComment = function (tokens) {
  return tokens.filter(token => token.semantic != 'comment.line')
}

export class TokenStorage {
  /**
   * 
   * @param {Token[]} tokens 
   */
  constructor (tokens) {
    this.tokens = tokens.map(token => token)
    this.putOffTokens = []
  }

  /**
   * @type {Token}
   */
  get current () {
    return this.tokens[0]
  }

  hitAny (...keywords) {
    return this.current && this.current.hitAny(...keywords)
  }

  notHitAll (...keywords) {
    return this.current && this.current.hitAny(...keywords) == false
  }

  assert (keyword) {
    if (this.hitAny(keyword) == false) {
      this.current.errors.push(new SyntaxError(`Unexpected Token`))
    }
  }

  /**
   * 
   * @param {string} keyword 
   * @returns 
   */
  loadIf (keyword) {
    return this.hitAny(keyword) ? this.tokens.shift() : null
  }

  load () {
    return this.tokens.shift()
  }

  putOff () {
    this.putOffTokens.push(this.load())
  }

  putOffIf(...keywords) {
    while (this.hitAny(...keywords)) {
      this.putOff()
    }
  }

  loadPuttedOffToken () {
    return this.putOffTokens.shift()
  }

  get hasPuttedOffTokens () {
    return this.putOffTokens.length > 0
  }

  /**
   * 
   * @param {(storage: TokenStorage) => void} callback 
   * @returns 
   */
  captureBlock (callback) {

    if (this.hitAny('block.open') == false) return

    var tokens = []
    var depth = 0
    this.skip() // Skip '{'

    while (this.notHitAll('block.close') || depth) {
      if (this.hitAny('block.open')) {
        depth += 1
      }
      if (this.hitAny('block.close')) {
        depth -= 1
      }
      tokens.push(this.load())
    }

    this.assert('block.close')
    this.skip() // Skip '}'

    callback(new TokenStorage(tokens))
  }

  skip () {
    this.tokens.shift()
  }

  trash () {
    const token = this.tokens.shift()
    token?.errors.push(new Error('Trash'))
  }
}

export class SchemaBuilder {
  constructor () {
    this.schema = {}
    this.tokens = []
  }

  /**
   * 
   * @param {Token} token 
   */
  describe (token) {

    this.tokens.push(token)

    if (typeof this.schema.summary == 'undefined') {
      this.schema.summary = token.value.replace(/^# */, '')
    } else {
      if (typeof this.schema.description == 'undefined') {
        this.schema.description = []
      }
      this.schema.description.push(token.value.replace(/^# */, ''))
    }
  }

  annotation (token) {
    this.tokens.push(token)
    if (typeof this.schema.annotation != 'undefined') {
      token.errors.push(new Error('Duplicated annotation'))
    }
    this.schema.annotation = token.value
  }

  set (name, provider, ...keywords) {
    if (provider instanceof Token) {
      if (keywords.length > 0 && provider.hitAny(...keywords) == false) {
        provider.errors.push(new Error(`Unexpected token: ${keywords.join(' or ')}`))
      }
      this.schema[name] = provider.value
      this.tokens.push(provider)
    } else if (provider instanceof TokenStorage) {
      if (keywords.length > 0 && provider.hitAny(...keywords) == false) {
        provider.current.errors.push(new Error(`Unexpected token: ${keywords.join(' or ')}`))
      }
      this.schema[name] = provider.current.value
      this.tokens.push(provider.load())
    } else if (typeof provider == 'function') {
      this.schema[name].push(provider())
    } else {
      this.schema[name] = provider
    }
  }

  push (name, provider, ...keywords) {
    if (keywords.length > 0 && !(provider instanceof Token)) {
      throw new Error('Parser Error')
    }
    if (typeof this.schema[name] == 'undefined') {
      this.schema[name] = []
    }
    if (provider instanceof Token) {
      if (provider.hitAny(...keywords) == false) {
        provider.errors.push(new Error(`Unexpected token: ${keywords.join(' or ')}`))
      }
      this.schema[name].push(provider.value)
      this.tokens.push(provider)
    } else if (provider instanceof TokenStorage) {
      if (keywords.length > 0 && provider.hitAny(...keywords) == false) {
        provider.current.errors.push(new Error(`Unexpected token: ${keywords.join(' or ')}`))
      }
      this.schema[name].push(provider.current.value)
      this.tokens.push(provider.load())
    } else if (typeof provider == 'function') {
      this.schema[name].push(provider())
    } else {
      this.schema[name].push(provider)
    }
  }

  setValue (name, storage, ...keywords) {
    if (storage.hitAny('array.open')) {
      storage.skip() // Skip array open
      while (storage.notHitAll('array.close')) {
        if (storage.hitAny('constant', 'string', 'variable.reference', 'parameter.assignment')) {
          this.push(name, storage)
        } else {
          this.trash()
        }
      }
      storage.skip() // Skip array close
    } else {
      return this.set(name, storage, 'constant', 'string', 'variable.reference', 'parameter.assignment')
    }
  }

  build () {
    if (process.env.DEBUG_TOKENS) {
      return { ...this.schema, tokens: this.tokens }
    } else {
      return this.schema
    }
  }
}

/**
 * 
 * @param {TokenStorage} storage 
 */
export const parseEntity = function (storage) {
  storage.assert('directive.entity')
  storage.load()

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
  }

  schema.set('name', storage.load(), 'name.entity')

  storage.captureBlock(storage => {
    while (storage.current) {
      storage.putOffIf('annotation', 'description')
      if (storage.hitAny('directive.field')) {
        schema.push('fields', parseField(storage))
        continue
      }
      if (storage.hitAny('directive.inner')) {
        schema.push('subtypes', parseSubschema(storage))
        continue
      }
      if (storage.hitAny('directive.endpoint')) {
        schema.push('endpoints', parseEndpoint(storage))
        continue
      }
      storage.trash()
    }
  })

  return schema.build()
}

/**
 * 
 * @param {TokenStorage} storage 
 */
 export const parseField = function (storage) {
  storage.assert('directive.field')
  storage.load()

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
    if (token.hitAny('annotation')) schema.annotation(token)
  }

  schema.set('name', storage, 'name')

  storage.assert('keyword.operator.definition.type')
  storage.skip()

  schema.set('type', storage, 'type')

  storage.captureBlock(storage => {
    while (storage.current) {
      if (storage.hitAny('keyword.property')) {
        const name = storage.load()
        schema.set(name.value, storage, 'property')
        continue
      }
      storage.putOffIf('annotation', 'description')
      if (storage.hitAny('directive.schema')) {
        schema.set('schema', parseSubschema(storage))
        continue
      }
      if (storage.hitAny('directive.example')) {
        storage.skip() // Skip example keyword
        schema.setValue('example', storage)
        continue
      }
      if (storage.hitAny('directive.enum')) {
        storage.skip() // Skip enum keyword
        schema.setValue('enum', storage)
        continue
      }
      storage.trash()
    }
  })

  const result = schema.build()
  // If default value is string with double quote, strip double quote for code generation.
  // Value type can be found in the `type` property of schema.
  if (typeof result.default == 'string' && /^\".*\"$/.test(result.default)) {
    result.default = result.default.replace(/^\"(.*)\"$/, '$1')
  }

  return result
}

export const parseSubschema = function (storage) {
  storage.skip()

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
  }

  if (storage.hitAny('name.inner')) {
    schema.set('name', storage, 'name.inner')
  }

  if (storage.hitAny('string')) {
    schema.set('mime', storage)
  } else {
    storage.captureBlock(storage => {
      while (storage.current) {
        storage.putOffIf('annotation', 'description')
        if (storage.hitAny('directive.field')) {
          schema.push('fields', parseField(storage))
          continue
        }
        storage.trash()
      }
    })
  }

  return schema.build()
}

export const parseEndpoint = function (storage) {
  storage.assert('directive.endpoint')
  storage.skip()

  const schema = new SchemaBuilder()

  schema.set('method', storage, 'http-method')

  schema.set('path', storage, 'http-path')

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
  }

  storage.captureBlock(storage => {
    while (storage.current) {
      if (storage.hitAny('keyword.property')) {
        const name = storage.load()
        schema.set(name.value, storage, 'property')
        continue
      }
      storage.putOffIf('annotation', 'description')
      if (storage.hitAny('directive.parameter')) {
        schema.push('parameters', parseParameter(storage))
        continue
      }
      if (storage.hitAny('directive.query')) {
        schema.push('query', parseQuery(storage))
        continue
      }
      if (storage.hitAny('directive.request')) {
        schema.set('request', parseSubschema(storage))
        continue
      }
      if (storage.hitAny('directive.success')) {
        schema.set('success', parseSubschema(storage))
        continue
      }
      storage.trash()
    }
  })

  return schema.build()
}

export const parseParameter = function (storage) {
  storage.assert('directive.parameter')
  storage.skip()

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
    if (token.hitAny('annotation')) schema.annotation(token)
  }

  schema.set('name', storage, 'name')

  storage.assert('keyword.operator.definition.type')
  storage.skip()

  schema.set('type', storage, 'type')

  storage.captureBlock(storage => {
    while (storage.current) {
      if (storage.hitAny('directive.example')) {
        storage.skip() // Skip example keyword
        schema.setValue('example', storage)
        continue
      }
      if (storage.hitAny('directive.enum')) {
        storage.skip() // Skip enum keyword
        schema.setValue('enum', storage)
        continue
      }
      storage.trash()
    }
  })

  return schema.build()
}

export const parseQuery = function (storage) {
  storage.assert('directive.query')
  storage.skip()

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
    if (token.hitAny('annotation')) schema.annotation(token)
  }

  schema.set('name', storage, 'name')

  storage.assert('keyword.operator.definition.type')
  storage.skip()

  schema.set('type', storage, 'type')

  storage.captureBlock(storage => {
    while (storage.current) {
      if (storage.hitAny('directive.example')) {
        storage.skip() // Skip example keyword
        schema.setValue('example', storage)
        continue
      }
      if (storage.hitAny('directive.enum')) {
        storage.skip() // Skip enum keyword
        schema.setValue('enum', storage)
        continue
      }
      storage.trash()
    }
  })

  return schema.build()
}

export const parseScenario = function (storage) {
  storage.assert('directive.scenario')
  storage.load()

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
    if (token.hitAny('annotation')) schema.annotation(token)
  }

  schema.set('name', storage, 'name')

  storage.captureBlock(storage => {
    while (storage.current) {
      storage.putOffIf('annotation', 'description')
      if (storage.hitAny('function.command')) {
        schema.push('steps', parseCommand(storage))
        continue
      }
      if (storage.hitAny('http-method')) {
        schema.push('steps', parseShorthandHttpRequest(storage))
        continue
      }
      if (storage.hitAny('request')) {
        schema.push('steps', parseShorthandReferenceRequest(storage))
        continue
      }
      storage.trash()
    }
  })

  return schema.build()
}

export const parseCommandSteps = function (storage) {

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
    if (token.hitAny('annotation')) schema.annotation(token)
  }

  schema.set('name', storage)

  storage.captureBlock(storage => {
    while (storage.current) {
      storage.putOffIf('annotation', 'description')
      if (storage.hitAny('function.command')) {
        schema.push('steps', parseCommand(storage))
        continue
      }
      storage.trash()
    }
  })

  return schema.build()
}

export const parseCommand = function (storage) {
  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
  }

  schema.set('command', storage, 'function.command')

  if (storage.hitAny('open.command')) {
    storage.skip()
  }

  while (storage.hitAny('parameter.command')) {
    schema.push('args', storage)
  }

  if (storage.hitAny('close.command')) {
    storage.skip()
  }

  return schema.build()
}

export const parseShorthandHttpRequest = function (storage) {
  const request = new SchemaBuilder()

  request.set('method', storage, 'http-method')
  request.set('path', storage, 'http-path')

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
  }

  schema.set('request', request.build())

  storage.captureBlock(storage => {
    const overrides = new SchemaBuilder()
    while (storage.current) {
      storage.putOffIf('annotation', 'description')
      if (storage.hitAny('assignment')) {
        const name = storage.load()
        if (storage.hitAny('operator.assignment')) {
          storage.skip()
        }
        overrides.tokens.push(name)
        overrides.setValue(name.value, storage)
        continue
      }
      if (storage.hitAny('setup')) {
        schema.set('setup', parseCommandSteps(storage))
        continue
      }
      if (storage.hitAny('receive')) {
        schema.set('receive', parseCommandSteps(storage))
        continue
      }
      storage.trash()
    }
    schema.set('overrides', overrides.build())
  })

  return schema.build()
}
export const parseShorthandReferenceRequest = function (storage) {
  const request = new SchemaBuilder()

  request.set('reference', storage, 'request')

  const schema = new SchemaBuilder()

  while (storage.hasPuttedOffTokens) {
    const token = storage.loadPuttedOffToken()
    if (token.hitAny('description')) schema.describe(token)
  }

  schema.set('request', request.build())

  storage.captureBlock(storage => {
    const overrides = new SchemaBuilder()
    while (storage.current) {
      storage.putOffIf('annotation', 'description')
      if (storage.hitAny('assignment')) {
        const name = storage.load()
        if (storage.hitAny('operator.assignment')) {
          storage.skip()
        }
        overrides.tokens.push(name)
        overrides.setValue(name.value, storage)
        continue
      }
      if (storage.hitAny('setup')) {
        schema.set('setup', parseCommandSteps(storage))
        continue
      }
      if (storage.hitAny('receive')) {
        schema.set('receive', parseCommandSteps(storage))
        continue
      }
      storage.trash()
    }
    schema.set('overrides', overrides.build())
  })

  return schema.build()
}

export default class Parser {
  constructor () {
  }

  /**
   * 
   * @param {Token[]} tokens 
   */
  parse (tokens) {
    const storage = new TokenStorage(stripComment(tokens.map(token => token)))
    const root = { entities: [], scenarios: [] }

    while (storage.current) {

      storage.putOffIf('annotation', 'description')

      switch (storage.current.semantic) {
        case 'keyword.directive.entity':
          root.entities.push(parseEntity(storage))
          break
        case 'keyword.directive.scenario':
          root.scenarios.push(parseScenario(storage))
          break
        default:
          storage.trash()
          break
      }
    }

    return root
  }
}