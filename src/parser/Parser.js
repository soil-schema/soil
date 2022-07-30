// @ts-check

import url from 'node:url'

const STEP = 1

import SyntaxError from '../errors/SyntaxError.js'
import Token from './Token.js'

const ENTITY_NAME_PATTERN = /^[A-Z][A-Za-z0-9_]+$/

const BLOCK_BEGIN       = '{'
const BLOCK_END         = '}'
const EXAMPLE_BEGIN     = '['
const EXAMPLE_END       = ']'
const DESCRIPTION_MARK  = '-'
const COMMENT_MARK      = '#'
const TYPE_SEPARATOR   = ':'

const KEYWORD_ENTITY    = 'entity'
const KEYWORD_FIELD     = 'field'
const KEYWORD_INNER     = 'inner'
const KEYWORD_ENDPOINT  = 'endpoint'
const KEYWORD_PARAMETER = 'parameter'
const KEYWORD_QUERY     = 'query'
const KEYWORD_SCHEMA    = 'schema'

export default class Parser {

  /**
   * @type {Token[]}
   */
  tokens

  /**
   * @type {number}
   */
  offset = 0

  /**
   * @type {string[]}
   */
   stack = []

  /**
   * @param {string} filepath 
   * @param {string} body 
   */
  constructor (filepath, body) {
    this.filepath = filepath
    this.body = body
    this.entities = []
    this.logs = []
  }

  /**
   * @param  {...string} messages 
   */
  log (...messages) {
    this.logs.push('  '.repeat(this.stack.length) + messages.join(' '))
  }

  /**
   * 
   * @param {string} name 
   */
  push (name) {
    if (typeof name != 'string') {
      throw new Error('invalid stack name')
    }
    this.stack.push(name)
  }

  /**
   * 
   * @param {string|undefined} name 
   */
  pop (name = undefined) {
    if (typeof name == 'string' && this.stack[this.stack.length - 1] != name) {
      console.warn('push/pop validation warning')
    }
    this.stack.pop()
  }

  /**
   * @returns {Token[]} tokens
   */
  tokenize () {
    const { body } = this
    const length = body.length
    var tokens = []
    var buffer = ''
    var i = 0
    var line = 1
    var offset = 1
    while (i < body.length) {
      const c = body[i]
      switch (c) {
        case '\r':
        case '\n':
          if (buffer.trim().length > 0)
            tokens.push(new Token(this.uri, line, offset - buffer.length, buffer.trim()))
          line += 1
          offset = 0
          buffer = ''
          break
        case ' ':
        case '\t':
          if (buffer.trim().length > 0)
            tokens.push(new Token(this.uri, line, offset - buffer.length, buffer.trim()))
          buffer = ''
          break
        case BLOCK_BEGIN:
        case BLOCK_END:
        case TYPE_SEPARATOR:
        case EXAMPLE_BEGIN:
        case EXAMPLE_END:
          const trim = buffer.trim()
          if (trim.length > 0)
            tokens.push(new Token(this.uri, line, offset - buffer.length, trim))
          tokens.push(new Token(this.uri, line, offset, c, 'keyword'))
          buffer = ''
          if (c == EXAMPLE_BEGIN) {
            i += 1
            offset += 1
            var inStringLiteral = false
            while (body[i] != EXAMPLE_END) {
              const t = body[i]
              i += 1
              offset += 1
              if (t == ',' && inStringLiteral == false) {
                tokens.push(new Token(this.uri, line, offset - buffer.trimStart().length, buffer.trim(), 'value'))
                buffer = ''
                continue
              }
              if (t == '"') {
                inStringLiteral = !inStringLiteral
                offset += 1
                continue
              }
              buffer += t
            }
            tokens.push(new Token(this.uri, line, offset - buffer.trimStart().length, buffer.trim(), 'value'))
            buffer = ''
            tokens.push(new Token(this.uri, line, offset, "]", 'keyword'))
          }
          break
        case DESCRIPTION_MARK:
          var comment = ''
          tokens.push(new Token(this.uri, line, offset, DESCRIPTION_MARK, 'keyword'))
          i += 1
          offset += 1
          while (body[i] != '\n' && i < body.length) {
            comment += body[i]
            i += 1
            offset += 1
          }
          tokens.push(new Token(this.uri, line, offset - comment.trimStart().length, comment.trim(), 'string'))
          line += 1
          offset = 1
          break
        case COMMENT_MARK:
          var comment = ''
          tokens.push(new Token(this.uri, line, offset, COMMENT_MARK, 'comment'))
          i += 1
          offset += 1
          while (body[i] != '\n' && i < body.length) {
            comment += body[i]
            i += 1
            offset += 1
          }
          tokens.push(new Token(this.uri, line, offset - comment.trimStart().length, comment.trim(), 'comment'))
          line += 1
          offset = 1
          break
        default:
          buffer += c
      }
      i += 1
      offset += 1
    }
    if (buffer.trim().length > 0)
      tokens.push(new Token(this.uri, line, offset, buffer.trim()))
    this.log('tokenized:', tokens.map(token => `'${token.token}'`).join(', '))
    Object.defineProperty(this, 'tokens', { value: tokens })
    return tokens
  }

  get currentStacks () {
    return this.stack.join(' » ')
  }

  /**
   * @type {string}
   */
  get uri () {
    return url.pathToFileURL(this.filepath).toString()
  }

  /**
   * @returns {Token}
   */
  get currentToken () {
    return this.pick(this.offset)
  }

  /**
   * @param {number} i 
   * @returns {Token}
   */
   pick (i) {
    if (i < 0) {
      throw new Error(`Illegal offset error: offset = ${i}`)
    }
    if (i >= this.tokens.length) {
      throw new Error(`Illegal offset error: offset = ${i}, tokens size = ${this.tokens.length}, stacks = ${this.currentStacks}`)
    }
    return this.tokens[i]
  }

  next () {
    this.offset += STEP
  }

  /**
   * @param {RegExp|string} tester 
   * @param {string} message 
   */
  assert (tester, message = 'Unexpected token') {
    if (this.currentToken.not(tester)) {
      throw new SyntaxError(this.currentToken)
    }
  }

  /**
   * @param {RegExp|string} tester 
   * @param {string} message 
   */
  notAssert (tester, message = 'Unexpected token') {
    if (this.currentToken.is(tester)) {
      throw new SyntaxError(this.currentToken)
    }
  }

  /**
   * @returns {object[]} array of soil entity
   */
  parse () {
    this.tokenize()
    while (this.offset < this.tokens.length - 1) {
      switch (this.currentToken.token) {
        case KEYWORD_ENTITY:
          this.entities.push(this.parseEntity())
          break
        default:
          throw new SyntaxError(this.currentToken)
      }
    }

    this.tokens.forEach(token => {
      if (typeof token.kind == 'undefined') {
        throw new Error(`Unknown kind token: ${token.token} at ${token.address}`)
      }
    })

    return this.entities
  }

  /**
   * Parse from `{` to `}` under standard rule and custom resolver.
   * @param {object} blockSchema
   * @param {() => void} tokenResolver custom token parser, it don't call with each token.
   */
  parseBlock (blockSchema, tokenResolver) {
    // if current token is not block begin token, stop this process.
    if (this.currentToken.not(BLOCK_BEGIN)) { return }

    this.next()
    var offsetValidator = this.offset
    var targetToken = this.currentToken

    try {
      while (this.currentToken.not(BLOCK_END)) {
        targetToken = this.currentToken
        switch (this.currentToken.token) {
          case DESCRIPTION_MARK:
            this.parseComment(blockSchema)
            this.next()
            break
          default:
            tokenResolver()
            break
        }
        if (this.offset == offsetValidator) {
          console.warn(`Offset don\'t increment: ${this.offset}`)
        }
        offsetValidator = this.offset
      }
    } catch (error) {
      console.log('Caught exception after parse:', targetToken.token, 'at', targetToken.address)
      throw error
    }

    // current token = `}` (block end token)

    this.next()
  }

  /**
   * Begin parsing entity directive at current position.
   * 
   * ```
   * entity {Entity Name} {
   *   <entity block>
   * }
   * ```
   */
  parseEntity () {
    this.assert(KEYWORD_ENTITY)
    this.currentToken.kind = 'keyword.directive.entity'

    this.next()
    this.assert(ENTITY_NAME_PATTERN, `Invalid entity name`)
    this.currentToken.kind = 'entity.entity'

    const name = this.currentToken.token

    const entitySchema = {
      name,
      fields: {},
      subtypes: [],
      endpoints: {},
    }

    this.log(`[Entity] ${name}`)
    this.push(name)

    this.next()

    this.parseBlock(entitySchema, () => {
      switch (this.currentToken.token) {
        case KEYWORD_FIELD:
          const field = this.parseField()
          const { name } = field
          delete field.name
          entitySchema.fields[name] = field
          break
  
        case KEYWORD_INNER:
          const innerType = this.parseInnerType()
          // @ts-ignore
          entitySchema.subtypes.push(innerType)
          break
  
        case KEYWORD_ENDPOINT:
          const endpoint = this.fk()
          if (typeof entitySchema.endpoints[endpoint.method] == 'undefined') {
            entitySchema.endpoints[endpoint.path] = {}
          }
          entitySchema.endpoints[endpoint.path][endpoint.method.toLowerCase()] = endpoint
          break
  
        case 'mutable':
        case 'reference':
        case 'identifier':
        case 'writer':
          this.next()
          this.assert(KEYWORD_FIELD)
          break
        default:
          throw new SyntaxError(this.currentToken)
  
      }
    })

    this.pop(name)

    return entitySchema
  }

  /**
   * ```
   * (mutable|reference|writer|identifier) field name: Type {
   *   <field block>
   * }
   * ```
   * 
   * or
   * 
   * ```
   * (mutable|reference|writer|identifier) field name: Type
   * ```
   * 
   * @returns {object}
   */
  parseField () {
    this.assert(KEYWORD_FIELD)
    this.currentToken.kind = 'keyword.directive.field'

    const annotation = this.tokens[this.offset - 1]

    this.next()
    const name = this.currentToken.token
    this.currentToken.kind = 'entity.field'

    this.log(`[Field] ${name}`)
    this.push(name)

    this.next()
    this.assert(TYPE_SEPARATOR)

    this.next()
    this.currentToken.kind = 'entity.type'
    const fieldSchema = {
      name,
      type: this.currentToken.token,
    }

    if (annotation.is(/^(mutable|reference|writer|identifier)$/)) {
      fieldSchema.annotation = annotation.token
      annotation.kind = `keyword.annotation.${annotation.token}`
    }

    this.next()

    if (/^(List<Enum>|Enum)\??$/.test(fieldSchema.type)) {
      // check enum items
      if (this.currentToken.is(EXAMPLE_BEGIN)) {
        fieldSchema.enum = this.parseEnumCases()
      }
    }

    this.parseBlock(fieldSchema, () => {
      switch (this.currentToken.token) {
      case KEYWORD_SCHEMA:
        this.currentToken.kind = 'keyword.directive.schema'
        this.next()
        this.assert(BLOCK_BEGIN)
        this.push(KEYWORD_SCHEMA)
        this.log('[Schema] .schema')
        fieldSchema.schema = this.parseSubschema()
        this.pop(KEYWORD_SCHEMA)
        break
      case 'example':
        this.currentToken.kind = 'keyword.directive.example'
        this.next()
        this.assert(EXAMPLE_BEGIN)
        const examples = this.parseExample()
        if (examples.length > 0) {
          fieldSchema.examples = examples
        }
        this.assert(EXAMPLE_END)
        this.next()
        break
      default:
        throw new SyntaxError(this.currentToken)
      }
    })

    this.pop(name)

    return fieldSchema
  }

  parseInnerType () {
    this.assert(KEYWORD_INNER)
    this.currentToken.kind = 'keyword.directive.inner'

    this.next()
    const name = this.currentToken.token
    this.currentToken.kind = 'entity.entity.inner'

    this.log(`[InnerType] ${name}`)
    this.push(name)

    const innerSchema = {
      name,
      fields: {},
    }

    this.next()

    this.parseBlock(innerSchema, () => {
      switch (this.currentToken.token) {
      case KEYWORD_FIELD:
        const field = this.parseField()
        const { name } = field
        delete field.name
        innerSchema.fields[name] = field
        break
      case 'mutable':
      case 'reference':
      case 'identifier':
      case 'writer':
        this.next()
        this.assert(KEYWORD_FIELD)
        break
      default:
        throw new SyntaxError(this.currentToken)
      }
    })

    this.pop()

    return innerSchema
  }

  fk () {
    this.assert(KEYWORD_ENDPOINT)
    this.currentToken.kind = `keyword.endpoint`
    
    this.next()
    const method = this.currentToken.token
    this.currentToken.kind = `entity.endpoint.method`

    this.next()
    const path = this.currentToken.token
    this.currentToken.kind = `entity.endpoint.path`

    this.log(`[Endpoint] ${method} ${path}`)
    this.push(`${method} ${path}`)

    const endpointSchema = {
      path,
      method,
      parameters: {},
      query: {},
    }

    this.next()

    this.parseBlock(endpointSchema, () => {
      switch (this.currentToken.token) {
        case 'request':
        case 'success':
          const name = this.currentToken.token
          this.currentToken.kind = `keyword.${name}`
          this.next()
          if (this.currentToken.is('mime')) {
            this.currentToken.kind = 'keyword.mime-prefix'
            this.next()
            this.assert(TYPE_SEPARATOR)
            this.next()
            const mimeType = this.currentToken.token
            this.currentToken.kind = 'string.mime-type'
            endpointSchema[name] = `mime:${mimeType}`
            this.next()
            return
          }
          this.assert(BLOCK_BEGIN)
          this.push(name)
          this.log(`[Schema] .${name}`)
          const subschema = this.parseSubschema()
          endpointSchema[name] = { schema: subschema.fields }
          this.pop(name)
          return
        case KEYWORD_PARAMETER:
          const parameter = this.parseParameter()
          endpointSchema.parameters[parameter.name] = parameter
          return
        case KEYWORD_QUERY:
          const query = this.parseQuery()
          endpointSchema.query[query.name] = query
          return
        default:
          throw new SyntaxError(this.currentToken)
      }
    })

    this.pop(`${method} ${path}`)

    return endpointSchema
  }

  /**
   * parse query directive in endpoint block.
   * 
   * ```
   * parameter name: Type
   * ```
   * 
   * or
   * 
   * ```
   * parameter name: Type {
   *   <query block>
   * }
   * ```
   * @returns {object}
   */
  parseParameter () {
    this.assert(KEYWORD_PARAMETER)
    this.currentToken.kind = 'keyword.directive.parameter'
    
    this.next()
    const name = this.currentToken.token
    this.currentToken.kind = 'entity.parameter'

    this.push(name)
    this.log(`[Parameter] ${name}`)

    this.next()
    this.assert(TYPE_SEPARATOR)
    
    this.next()
    const type = this.currentToken.token
    this.currentToken.kind = 'entity.type'

    const parameterSchema = {
      name,
      type,
    }

    this.next()

    if (type == 'Enum' && this.currentToken.is(EXAMPLE_BEGIN)) {
      parameterSchema.enum = this.parseEnumCases()
    }

    this.parseBlock(parameterSchema, () => {
      throw new SyntaxError(this.currentToken)
    })

    this.pop(name)

    return parameterSchema
  }

  /**
   * parse query directive in endpoint block.
   * 
   * ```
   * query name: Type
   * ```
   * 
   * or
   * 
   * ```
   * query name: Type {
   *   <query block>
   * }
   * ```
   * @returns {object}
   */
  parseQuery () {
    this.assert(KEYWORD_QUERY)
    this.currentToken.kind = 'keyword.directive.query'

    this.next()
    const name = this.currentToken.token
    this.currentToken.kind = 'entity.query'

    this.push(name)
    this.log(`[Query] ${name}`)

    this.next()
    this.assert(TYPE_SEPARATOR)

    this.next()
    const type = this.currentToken.token
    this.currentToken.kind = 'entity.type'

    const querySchema = {
      name,
      type,
    }

    this.next()

    if (type == 'Enum' && this.currentToken.is(EXAMPLE_BEGIN)) {
      querySchema.enum = this.parseEnumCases()
    }

    this.parseBlock(querySchema, () => {
      throw new SyntaxError(this.currentToken)
    })

    this.pop()

    return querySchema
  }

  parseExample () {
    this.assert(EXAMPLE_BEGIN)

    this.next()
    var examples = []

    while (this.currentToken.not(EXAMPLE_END)) {
      examples.push(this.currentToken.token)
      this.next()
    }

    this.assert(EXAMPLE_END)

    return examples
  }

  parseSubschema () {
    this.assert(BLOCK_BEGIN)

    const schema = {
      fields: {},
    }

    this.parseBlock(schema, () => {
      switch (this.currentToken.token) {
        case KEYWORD_FIELD:
          const field = this.parseField()
          schema.fields[field.name] = field
          break
        case 'mutable':
        case 'reference':
        case 'identifier':
        case 'writer':
          this.next()
          this.assert(KEYWORD_FIELD)
          break
        default:
          throw new SyntaxError(this.currentToken)
      }
    })

    return schema
  }

  /**
   * @returns {string[]}
   */
  parseEnumCases () {
    this.assert(EXAMPLE_BEGIN)
    this.next()
    var items = []
    while (this.currentToken.not(EXAMPLE_END)) {
      items.push(this.currentToken.token)
      this.next()
    }
    this.assert(EXAMPLE_END)
    this.next()
    return items
  }

  /**
   * @param {object} schema 
   */
  parseComment (schema) {
    this.assert(DESCRIPTION_MARK)
    this.next()
    if (typeof schema.summary == 'undefined') {
      schema.summary = this.currentToken.token
    } else {
      if (typeof schema.description == 'string') {
        schema.description += '\n'
        schema.description += this.currentToken.token
      } else {
        schema.description = this.currentToken.token
      }
    }
  }
}