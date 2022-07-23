import Endpoint from './models/Endpoint.js'
import Entity from './models/Entity.js'
import Field from './models/Field.js'
import RequestBody from './models/RequestBody.js'
import Response from './models/Response.js'
import Type from './models/Type.js'
import Writer from './models/Writer.js'

const SWIFT_TYPE_TABLE = {
  'String': 'String',
  'Integer': 'Int',
  'Number': 'Double',
  'Boolean': 'Bool',
  'Date': 'Date',
  'Timestamp': 'Date',
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
  return `${scope(_scope)}var ${name.camelize()}: ${type}${typeof value == 'undefined' ? '' : ` = ${value}`}`
}

const readOnlyMember = function (_scope = null, name, type, value) {
  return `${scope(_scope)}let ${name.camelize()}: ${type}${typeof value == 'undefined' ? '' : ` = ${value}`}`
}

const parameter = function (label = null, name, type) {
  return `${label == null ? '' : `${label} `}${name.camelize()}: ${convertType(type)}`
}

const init = function (_scope = null, ...parameters) {
  return `${scope(_scope)}init(${parameters.map(param => {
    if (typeof param == 'string') {
      return param
    } else {
      return parameter(param.label, param.name, param.type)
    }
  }).join(', ')}) {`
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
  if (type instanceof Type) {
    return convertType(type.definition)
  }
  if (SWIFT_TYPE_TABLE[type]) {
    return SWIFT_TYPE_TABLE[type]
  }
  if (/^List\<.+\>$/.test(type)) {
    const element = type.match(/^List\<(.+)\>$/)[1]
    return `Array<${convertType(element)}>`
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

const protocolMerge = ({ config }, ...keys) => {
  var protocols = keys
    .flatMap(key => config.swift.protocols[key])
    .filter(protocol => protocol != null && protocol != undefined)

  // Encodable & Decodable -> Codable
  if (protocols.indexOf('Decodable') != -1 && protocols.indexOf('Encodable') != -1) {
    protocols = protocols
      .filter(protocol => protocol != 'Decodable' && protocol != 'Encodable')
    protocols.push('Codable')
  }

  return protocols
}

Array.prototype.joinCode = function () {
  return this.filter(item => item != null).join('\n')
}

/*
  ================================
  Swift Source Code Renderer Extensions
 */

Entity.prototype.renderSwiftFile = function (context) {
  return pretty([
    'import Foundation',
    this.renderSwiftStruct(context),
  ].joinCode(), context.config || {})
}

Entity.prototype.renderSwiftStruct = function (context) {
  const nextContext = { entity: this, ...context }
  return [
    docc(this),
    classDef('public final', this.name, ...protocolMerge(context, 'entity', (this.requireWritable && !this.immutable) ? null : 'writer')),
    ...this.readableFields.map(field => field.renderSwiftMember(nextContext)),
    ...this.subtypes.map(subtype => subtype.renderSwiftStruct(nextContext)),
    defineIf(this.requireWritable && !this.immutable, () => this.writeOnly().renderSwiftStruct(nextContext)),
    ...this.endpoints.map(endpoint => endpoint.renderSwiftStruct(nextContext)),
    end,
  ].joinCode()
}

Writer.prototype.renderSwiftStruct = function (context) {
  const nextContext = { ...context, writer: this }
  return [
    struct('public', 'Writer', ...protocolMerge(nextContext, 'writer')),
    ...this.fields.map(field => field.renderSwiftMember(nextContext)),
    docc({ parameters: this.fields }),
    init('public', ...this.fields.map(field => field.renderArgumentSignature(nextContext))),
      ...this.fields.map(field => `self.${field.name.camelize()} = ${field.name.camelize()}`),
    end,
    end,
  ].joinCode()
}

Field.prototype.renderSwiftMember = function (context) {
  const { writer, entity } = context
  var scope = 'public'
  var type = convertType(this.type)
  if (writer) {
    const reference = context.resolveReference(type)
    if (reference instanceof Entity && reference.requireWritable) {
      type = `${type}.Writer`
    }
    if (/^Array\<.+\>$/.test(type)) {
      const element = type.match(/^Array\<(.+)\>$/)[1]
      const reference = context.resolveReference(element)
      if (reference instanceof Entity && reference.requireWritable) {
        type = `Array<${element}.Writer>`
      }
    }
  }
  if (this.hasAnnotation('Optional')) {
    type = `${type}?`
  }
  if (this.hasAnnotation('Immutable') || (entity || {}).immutable) {
    return [
      docc(this),
      readOnlyMember(scope, this.name, type),
    ].joinCode()
  }
  if (this.hasAnnotation('ReadOnly')) {
    scope = 'public internal(set)'
  }
  return [
    docc(this),
    member(scope, this.name, type),
  ].joinCode()
}

Field.prototype.renderArgumentSignature = function (context) {
  const { writer } = context
  var type = convertType(this.type)
  if (writer) {
    const reference = context.resolveReference(type)
    if (reference instanceof Entity && reference.requireWritable) {
      type = `${type}.Writer`
    }
    if (/^Array\<.+\>$/.test(type)) {
      const element = type.match(/^Array\<(.+)\>$/)[1]
      const reference = context.resolveReference(element)
      if (reference instanceof Entity && reference.requireWritable) {
        type = `Array<${element}.Writer>`
      }
    }
  }
  if (this.hasAnnotation('Optional')) {
    type = `${type}?`
  }
  return `${this.name.camelize()}: ${type}`
}

Endpoint.prototype.renderSwiftStruct = function (context) {
  return [
    docc(this),
    struct('public', this.signature, ...protocolMerge(context, 'endpoint')),

    docc(`${this.signature}.path: \`${this.path}\``),
    readOnlyMember('public', 'path', 'String'),

    docc(`${this.signature}.method: \`${this.method}\``),
    readOnlyMember('public', 'method', 'String', `"${this.method}"`),

    defineIf(this.allowBody, () => member('public', 'body', 'RequestBody!', 'nil')),

    docc({ parameters: this.resolvePathParameters(context) }),
    init('public', ...this.resolvePathParameters(context)),
      `self.path = "${this.path}"`,
      ...this.resolvePathParameters(context).map(field => `.replacingOccurrences(of: "{${field.name}}", with: ${stringify(field.name.camelize(), field.type)})`),
    end,

    defineIf(this.allowBody, () => this.requestBody.renderSwiftStruct(context)),
    this.successResponse.renderSwiftStruct(context),

    end,
  ].joinCode()
}

RequestBody.prototype.renderSwiftStruct = function (context) {
  if (this.schema == null) { return 'public typealias RequestBody = Never' }
  if (this.schema == 'binary') { return 'public typealias RequestBody = Data' }

  const parameters = this.resolveParameters(context)
  return [
    docc(this),
    struct('public', 'RequestBody', ...protocolMerge(context, 'requestBody')),

    ...parameters.map(parameter => readOnlyMember(null, parameter.name, convertType(parameter.type))),

    docc({ parameters }),
    init('public', ...parameters),
      ...parameters.map(parameter => `self.${parameter.name.camelize()} = ${parameter.name.camelize()}`),
    end,

    end,
  ].joinCode()
}

Response.prototype.renderSwiftStruct = function (context) {
  if (this.schema == null) { return 'public typealias Response = Never' }

  const parameters = this.resolveParameters(context)
  return [
    docc(this),
    struct('public', 'Response', ...protocolMerge(context, 'response')),

    ...parameters.map(parameter => readOnlyMember('public', parameter.name, convertType(parameter.type))),

    end,
  ].joinCode()
}

export default { docc, struct, member, pretty, end, convertType }