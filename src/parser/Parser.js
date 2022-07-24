import Endpoint from "../models/Endpoint.js"
import Entity from "../models/Entity.js"

const STEP = 1

export default class Parser {

  constructor () {
    this.entities = []
  }

  /**
   * @param {string} body 
   * @returns {string[]} tokens
   */
  tokenize (body) {
    const length = body.length
    var tokens = []
    var buffer = ''
    var i = 0
    while (i < body.length) {
      const c = body[i]
      switch (c) {
        case '\n':
        case ' ':
          if (buffer.trim().length > 0)
            tokens.push(buffer.trim())
          buffer = ''
          break
        case '{':
        case '}':
        case ':':
          const trim = buffer.trim()
          if (trim.length > 0)
            tokens.push(trim)
          tokens.push(c)
          buffer = ''
          break
        case '-':
          var comment = ''
          i += STEP
          while (body[i] != '\n' && i < body.length) {
            comment += body[i]
            i += STEP
          }
          tokens.push('-', comment.trim())
          break
        default:
          buffer += c
      }

      i += STEP
    }
    if (buffer.trim().length > 0)
      tokens.push(buffer.trim())
    return tokens
  }

  /**
   * @param {string} body .soil file body
   * @returns {object[]} array of soil entity
   */
  parse (body) {
    const tokens = this.tokenize(body)
    var i = 0
    if (tokens[i] == 'entity') {
      i = this.parseEntity(tokens, i)
    } else {
      throw 'Syntax Error'
    }
    return this.entities
  }

  parseEntity (tokens, i) {
    if (tokens[i] != 'entity') {
      throw 'Illegal Call'
    }
    i += STEP
    var schema = {
      name: tokens[i],
      fields: {},
      endpoints: [],
    }
    i += STEP
    if (tokens[i] != '{') {
      throw 'Unexpected token'
    }
    i += STEP
    while (tokens[i] != '}') {
      var token = tokens[i]
      switch (token) {
      case 'field':
        i = this.parseField(tokens, i, schema)
        break
      case 'endpoint':
        i = this.parseEndpoint(tokens, i, schema)
        break
      default:
        i += STEP
        break
      }
    }
    this.entities.push(new Entity(schema))
    return i
  }

  parseField (tokens, i, schema) {
    if (tokens[i] != 'field') {
      throw 'Illegal Call'
    }
    let bi = i - STEP
    var annotations = []
    while (['mutable', 'reference', 'writer', 'identifier'].indexOf(tokens[bi]) != -1) {
      annotations.push(tokens[bi])
      bi -= STEP
    }
    i += STEP
    if (tokens[i + 1] != ':') {
      throw 'Unexpected Token'
    }
    const name = tokens[i]
    i += STEP
    if (tokens[i] != ':') {
      throw 'Unexpected Token'
    }
    i += STEP
    var fieldSchema = {
      type: tokens[i],
    }
    i += STEP

    annotations.forEach(annotation => fieldSchema[annotation] = true)

    if (tokens[i] == '{') {
      i = this.parseFieldBlock(tokens, i, fieldSchema)
    }

    schema.fields[name] = fieldSchema

    return i
  }

  parseFieldBlock (tokens, i, schema) {
    if (tokens[i] != '{') {
      throw 'Illegal Call'
    }
    i += STEP
    var hasSummary = false
    while (tokens[i] != '}') {
      var token = tokens[i]
      switch (token) {
      case '-':
        i += STEP
        if (hasSummary == false) {
          hasSummary = true
          schema.summary = tokens[i]
        } else {
          schema.description = tokens[i]
        }
        break
      default:
        i += STEP
        break
      }
    }
    return i
  }

  parseEndpoint (tokens, i, schema) {
    if (tokens[i] != 'endpoint') {
      throw 'Illegal Call'
    }
    i += STEP
    const method = tokens[i]
    i += STEP
    const path = tokens[i]
    i += STEP
    var endpointSchema = {}

    if (tokens[i] == '{') {
      var hasSummary = false
      while (tokens[i] != '}') {
        const token = tokens[i]
        switch (token) {
          case 'success':
            i += STEP
            var subschema = { fields: {} }
            i = this.parseSubschema(tokens, i, subschema)
            endpointSchema.success = subschema.fields
            break
          case '-':
            i += STEP
            if (hasSummary == false) {
              hasSummary = true
              endpointSchema.summary = tokens[i]
            } else {
              endpointSchema.description = tokens[i]
            }
            break
        }
        i += STEP
      }
      i += STEP
    }

    schema.endpoints.push(new Endpoint(path, method, endpointSchema))

    return i
  }

  parseSubschema (tokens, i, schema) {
    if (tokens[i] != '{') {
      throw 'Unexpected Token'
    }
    i += STEP
    while (tokens[i] != '}') {
      const token = tokens[i]
      switch (token) {
        case 'field':
          i = this.parseField(tokens, i, schema)
          break
        default:
          i += STEP
      }
    }
    return i
  }
}