// @ts-check

const STEP = 1

import SyntaxError from '../errors/SyntaxError.js'
import Token from './Token.js'

const ENTITY_NAME_PATTERN = /^[A-Z][A-Za-z0-9_]+$/

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

  pop () {
    this.stack.pop()
  }

  get currentStacks () {
    return this.stack.join(' » ')
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
        case '\n':
          if (buffer.trim().length > 0)
            tokens.push(new Token(this.filepath, line, offset - buffer.length, buffer.trim()))
          line += 1
          offset = 0
          buffer = ''
          break
        case ' ':
          if (buffer.trim().length > 0)
            tokens.push(new Token(this.filepath, line, offset - buffer.length, buffer.trim()))
          buffer = ''
          break
        case '{':
        case '}':
        case ':':
        case '[':
        case ']':
          const trim = buffer.trim()
          if (trim.length > 0)
            tokens.push(new Token(this.filepath, line, offset - buffer.length, trim))
          tokens.push(new Token(this.filepath, line, offset, c))
          buffer = ''
          if (c == '[') {
            i += 1
            offset += 1
            var inStringLiteral = false
            while (body[i] != ']') {
              const t = body[i]
              i += 1
              offset += 1
              if (t == ',' && inStringLiteral == false) {
                tokens.push(new Token(this.filepath, line, offset - buffer.trimStart().length, buffer.trim()))
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
            tokens.push(new Token(this.filepath, line, offset - buffer.trimStart().length, buffer.trim()))
            buffer = ''
            tokens.push(new Token(this.filepath, line, offset, "]"))
          }
          break
        case '-':
          var comment = ''
          tokens.push(new Token(this.filepath, line, offset, '-'))
          i += 1
          offset += 1
          while (body[i] != '\n' && i < body.length) {
            comment += body[i]
            i += 1
            offset += 1
          }
          tokens.push(new Token(this.filepath, line, offset - comment.trimStart().length, comment.trim()))
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
      tokens.push(new Token(this.filepath, line, offset, buffer.trim()))
    this.log('tokenized:', tokens.map(token => `'${token.token}'`).join(', '))
    Object.defineProperty(this, 'tokens', { value: tokens })
    return tokens
  }

  /**
   * 
   * @param {number} i 
   * @returns {Token}
   */
  pick (i) {
    if (i < 0) {
      throw new Error(`Illegal offset error: offset = ${i}`)
    }
    if (i >= this.tokens.length) {
      if (this.stack.length > 0) {
        throw new SyntaxError(`Unterminated entity block: ${this.currentStacks}`)
      }
      throw new Error(`Illegal offset error: offset = ${i}, tokens size = ${this.tokens.length}`)
    }
    return this.tokens[i]
  }

  /**
   * @returns {Token}
   */
  get currentToken () {
    return this.pick(this.offset)
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
    while (this.currentToken.is('entity')) {
      this.entities.push(this.parseEntity())
    }
    if (this.offset < this.tokens.length - 1) {
      throw new SyntaxError('Uncompleted parsing')
    }
    return this.entities
  }

  parseEntity () {
    this.assert('entity')

    this.next()
    this.assert(ENTITY_NAME_PATTERN, `Invalid entity name`)

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
    this.assert('{')

    this.next()
    while (this.currentToken.not('}')) {

      switch (this.currentToken.token) {
      case 'field':
        const field = this.parseField()
        const { name } = field
        delete field.name
        entitySchema.fields[name] = field
        break

      case 'inner':
        const innerType = this.parseInnerType()
        // @ts-ignore
        entitySchema.subtypes.push(innerType)
        break

      case 'endpoint':
        const endpoint = this.parseEndpoint()
        if (typeof entitySchema.endpoints[endpoint.method] == 'undefined') {
          entitySchema.endpoints[endpoint.path] = {}
        }
        entitySchema.endpoints[endpoint.path][endpoint.method.toLowerCase()] = endpoint
        this.next()
        break

      case 'mutable':
        this.next()
        this.assert('field')
        break

      default:
        throw new SyntaxError(this.currentToken)

      }

    }

    this.pop()

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
    this.assert('field')

    const annotation = this.tokens[this.offset - 1]

    this.next()
    const name = this.currentToken.token

    this.log(`[Field] ${name}`)
    this.push(name)

    this.next()
    this.assert(':')

    this.next()
    const fieldSchema = {
      name,
      type: this.currentToken.token,
    }

    if (annotation.is(/^(mutable|reference|writer|identifier)$/)) {
      fieldSchema.annotation = annotation.token
    }

    this.next()

    if (this.currentToken.is('{')) {
      this.parseFieldBlock(fieldSchema)
    }

    this.pop()

    return fieldSchema
  }

  parseFieldBlock (schema) {
    this.assert('{')

    this.next()

    while (this.currentToken.not('}')) {
      switch (this.currentToken.token) {
      case '-':
        this.next()
        if (typeof schema.summary == 'undefined') {
          schema.summary = this.currentToken.token
        } else {
          schema.description = this.currentToken.token
        }
        break
      case 'schema':
        this.next()
        this.assert('{')
        this.push('schema')
        this.log('[Schema] .schema')
        schema.schema = this.parseSubschema()
        this.assert('}')
        this.pop()
        break
      case 'example':
        this.next()
        this.assert('[')
        const examples = this.parseExample()
        if (examples.length > 0) {
          schema.examples = examples
        }
        this.assert(']')
        break
      default:
        throw new SyntaxError(this.currentToken)
      }
      this.next()
    }

    this.assert('}')
    this.next()
  }

  parseInnerType () {
    this.assert('inner')

    this.next()
    const name = this.currentToken.token

    this.log(`[InnerType] ${name}`)
    this.push(name)

    const innerSchema = {
      name,
      fields: {},
    }

    this.next()

    if (this.currentToken.is('{')) {
      this.parseInnerBlock(innerSchema)
      this.assert('}')
    }

    this.next()

    this.pop()

    return innerSchema
  }

  /**
   * @param {object} schema 
   */
  parseInnerBlock (schema) {
    this.assert('{')

    this.next()

    while (this.currentToken.not('}')) {
      switch (this.currentToken.token) {
      case '-':
        this.next()
        if (typeof schema.summary == 'undefined') {
          schema.summary = this.currentToken.token
        } else {
          schema.description = this.currentToken.token
        }
        this.next()
        break
      case 'field':
        const field = this.parseField()
        schema.fields[field.name] = field
        break
      default:
        throw new SyntaxError(this.currentToken)
      }
    }

    this.assert('}')
  }

  parseEndpoint () {
    this.assert('endpoint')
    
    this.next()
    const method = this.currentToken.token

    this.next()
    const path = this.currentToken.token

    this.log(`[Endpoint] ${method} ${path}`)

    const endpointSchema = {
      path,
      method,
      parameters: {}
    }

    this.next()

    if (this.currentToken.is('{')) {
      this.next()
      while (this.currentToken.not('}')) {
        switch (this.currentToken.token) {
          case 'success':
          case 'request':
            const name = this.currentToken.token
            this.next()
            this.assert('{')
            this.push(name)
            this.log(`[Schema] .${name}`)
            const subschema = this.parseSubschema()
            endpointSchema[name] = { schema: subschema.fields }
            this.pop()
            this.assert('}')
            this.next()
            break
          case 'parameter':
            const parameter = this.parseParameter()
            endpointSchema.parameters[parameter.name] = parameter
            break
          case '-':
            this.next()
            if (typeof endpointSchema.summary == 'undefined') {
              endpointSchema.summary = this.currentToken.token
            } else {
              endpointSchema.description = this.currentToken.token
            }
            this.next()
            break
          default:
            throw new SyntaxError(this.currentToken)
        }
      }
    }

    return endpointSchema
  }

  parseParameter () {
    this.assert('parameter')
    
    this.next()
    const name = this.currentToken.token

    this.push(name)
    this.log(`[Parameter] ${name}`)

    this.next()
    this.assert(':')
    
    this.next()
    const type = this.currentToken.token

    const parameterSchema = {
      name,
      type,
    }

    this.next()

    if (type == 'Enum' && this.currentToken.is('[')) {
      this.next()
      var items = []
      while (this.currentToken.not(']')) {
        items.push(this.currentToken.token.replace(/,$/, ''))
        this.next()
      }
      this.assert(']')
      this.next()
      parameterSchema.enum = items
    }

    this.pop()

    return parameterSchema
  }

  parseExample () {
    this.assert('[')

    this.next()
    var examples = []

    while (this.currentToken.not(']')) {
      examples.push(this.currentToken.token)
      this.next()
    }

    this.assert(']')

    return examples
  }

  parseSubschema () {
    this.assert('{')

    const schema = {
      fields: {},
    }

    this.next()
    while (this.currentToken.not('}')) {
      switch (this.currentToken.token) {
        case 'field':
          const field = this.parseField()
          schema.fields[field.name] = field
          break
        default:
          throw new SyntaxError(this.currentToken)
      }
    }

    this.assert('}')
    return schema
  }
}