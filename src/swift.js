import Endpoint from "./models/Endpoint.js"
import Entity from "./models/Entity.js"
import Field from "./models/Field.js"
import RequestBody from "./models/RequestBody.js"
import Response from "./models/Response.js"
import WriteOnlyEntity from "./models/WriteOnlyEntity.js"

const SWIFT_TYPE_TABLE = {
  'String': 'String',
  'Integer': 'Int',
}

/*
  ================================
  Render function for Swift Language Tokens
 */

const docc = function (target) {

  if (typeof target == 'string') {
    return target.split('\n').map(comment => `/// ${comment}`)
  }

  var comments = []

  if (target.summary) {
    comments.push(target.summary)
  }
  if (target.description) {
    if (comments.length > 0) comments.push('')
    comments.push(target.description)
  }
  if (target.parameters) {
    if (Array.isArray(target.parameters) && target.parameters.length > 0) {
      if (comments.length > 0) comments.push('')
      comments.push('- Parameters:')
      target.parameters.forEach(parameter => {
        comments.push(`  - ${parameter.name}: ${parameter.description || parameter.summary || '{No Hint}'}`)
      })
    } else if (typeof target.parameters == 'object' && !Array.isArray(target.parameters)) {
      if (comments.length > 0) comments.push('')
      comments.push('- Parameters:')
      Object.keys(target.parameters).forEach(name => {
        comments.push(`  - ${name}: ${target.parameters[name]}`)
      })
    }
  }

  if (comments.length == 0) {
    return null
  }

  return comments.flatMap(comment => comment.split('\n').map(comment => `/// ${comment}`)).join('\n')
}

const scope = function (scope = null) {
  return scope == null ? '' : `${scope} `
}

const classDef = function (_scope = null, name, ...protocols) {
  return `${scope(_scope)}class ${name}${protocols.length > 0 ? `: ${protocols.join(', ')}` : ''} {`
}

const struct = function (_scope = null, name, ...protocols) {
  return `${scope(_scope)}struct ${name}${protocols.length > 0 ? `: ${protocols.join(', ')}` : ''} {`
}

const member = function (_scope = null, name, type, value) {
  return `${scope(_scope)}var ${name}: ${type}${typeof value == 'undefined' ? '' : ` = ${value}`}`
}

const readOnlyMember = function (_scope = null, name, type, value) {
  return `${scope(_scope)}let ${name}: ${type}${typeof value == 'undefined' ? '' : ` = ${value}`}`
}

const parameter = function (label = null, name, type) {
  return `${label == null ? '' : `${label} `}${name}: ${convertType(type)}`
}

const init = function (_scope = null, ...parameters) {
  return `${scope(_scope)}init(${parameters.map(param => parameter(param.label, param.name, param.type)).join(', ')}) {`
}

const end = '}'

const defineIf = function (condition, callback) {
  return condition ? callback() : null
}

/*
  ================================
  Utilities
 */

const convertType = (type) => {
  if (SWIFT_TYPE_TABLE[type]) {
    return SWIFT_TYPE_TABLE[type]
  }
  if (/^List\<.+\>$/.test(type)) {
    const element = type.match(/^List\<(.+)\>$/)[1]
    return `Array<${this.convertType(element)}>`
  }
  return type
}

const stringify = (name, type) => {
  switch (type) {
    case 'Integer':
      return `"${name}"`
  }
  return name
}

const pretty = (code, config) => {
  const lines = code.split('\n')
  const { indent } = config.swift
  var result = []
  var indentLevel = 0
  var commentBuffer = []
  for (var line of lines) {
    if (line.startsWith('///')) {
        commentBuffer.push(`${indent.repeat(indentLevel)}${line}`)
        continue
    }
    const hasBlockSignature = /^(?:(public|open|internal|private|fileprivate|final)(?:\(set\))?\s+)*(var|let|struct|class|init|deinit|func|protocol|typealias)/.test(line)
    if (hasBlockSignature) {
        result.push('')
        result.push(...commentBuffer)
    }
    if (line.startsWith('.')) {
      indentLevel += 1
    }
    if (line == '}') {
      indentLevel -= 1
    }
    result.push(`${indent.repeat(indentLevel)}${line}`)
    if (hasBlockSignature && line.endsWith('{')) {
      indentLevel += 1
    }
    if (line.startsWith('.')) {
      indentLevel -= 1
    }
    commentBuffer = []
  }
  return result.join('\n')
}

const protocolMerge = (...keys) => {
  return ''
}

Array.prototype.joinCode = function () {
  return this.filter(item => item != null).join('\n')
}

/*
  ================================
  Swift Source Code Renderer Extensions
 */

Entity.prototype.renderSwiftFile = function (context) {
  const nextContext = { entity: this, ...context }
  return pretty([
    docc(this),
    classDef('public final', this.name),
    ...this.readableFields.map(field => field.renderSwiftMember(nextContext)),
    defineIf(this.requireWritable, () => this.writeOnly().renderSwiftStruct(nextContext)),
    ...this.endpoints.map(endpoint => endpoint.renderSwiftStruct(nextContext)),
    end,
  ].joinCode(), context.config || {})
}

WriteOnlyEntity.prototype.renderSwiftStruct = function (context) {
  return [
    struct('public', this.name),
    ...this.fields.map(field => field.renderSwiftMember(context)),
    docc({ parameters: this.fields }),
    init('public', ...this.fields),
      ...this.fields.map(field => `this.${field.name} = ${field.name}`),
    end,
    end,
  ].joinCode()
}

Field.prototype.renderSwiftMember = function (context) {
  var scope = 'public'
  if (this.hasAnnotation('Immutable')) {
    return [
      docc(this),
      readOnlyMember(scope, this.name, convertType(this.type)),
    ].joinCode()
  }
  if (this.hasAnnotation('ReadOnly')) {
    scope = 'public internal(set)'
  }
  return [
    docc(this),
    member(scope, this.name, convertType(this.type)),
  ].joinCode()
}

Field.prototype.renderArgumentSignature = function (context) {
  return `${this.name}: ${convertType(this.type)}`
}

Endpoint.prototype.renderSwiftStruct = function (context) {
  return [
    docc(this),
    struct('public', this.signature),

    docc(`${this.signature}.path: ${this.path}`),
    readOnlyMember('public', 'path', 'String'),

    docc(`${this.signature}.method: ${this.method}`),
    readOnlyMember('public', 'method', 'String', `"${this.method}"`),

    docc({ parameters: this.resolvePathParameters(context) }),
    init('public', ...this.resolvePathParameters(context)),
      `this.path = "${this.path}"`,
      ...this.resolvePathParameters(context).map(field => `.replacingOccurrences(of: "{${field.name}}", with: ${stringify(field.name, field.type)})`),
    end,

    this.requestBody.renderSwiftStruct(context),
    this.successResponse.renderSwiftStruct(context),

    end,
  ].joinCode()
}

RequestBody.prototype.renderSwiftStruct = function (context) {
  if (this.schema == null) { return 'public typealias RequestBody = Never' }

  const parameters = this.resolveParameters(context)
  return [
    docc(this),
    struct('public', 'RequestBody'),

    ...parameters.map(parameter => readOnlyMember(null, parameter.name, parameter.type)),

    docc({ parameters }),
    init('public', ...parameters),
      ...parameters.map(parameter => `this.${parameter.name} = ${parameter.name}`),
    end,

    end,
  ].joinCode()
}

Response.prototype.renderSwiftStruct = function (context) {
  if (this.schema == null) { return 'public typealias Response = Never' }

  const parameters = this.resolveParameters(context)
  return [
    docc(this),
    struct('public', 'Response'),

    ...parameters.map(parameter => readOnlyMember('public', parameter.name, parameter.type)),

    end,
  ].joinCode()
}

export default { docc, struct, member, pretty, end, convertType }