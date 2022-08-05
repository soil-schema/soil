import UnsupportedKeywordError from './errors/UnsupportedKeywordError.js'
import Endpoint from './graph/Endpoint.js'
import Entity from './graph/Entity.js'
import Field from './graph/Field.js'
import Parameter from './graph/Parameter.js'
import Query from './graph/Query.js'
import RequestBody from './graph/RequestBody.js'
import Response from './graph/Response.js'
import Type from './graph/Type.js'
import Writer from './graph/Writer.js'

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
        if (parameter instanceof Parameter) {
          comments.push(`  - ${parameter.name.camelize()}: ${parameter.description || parameter.summary || '{no comment}'}`)
        } else {
          comments.push(`  - ${parameter.name}: ${parameter.description || parameter.summary || '{no comment}'}`)
        }
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
    } else if (typeof param == 'undefined') {
      return undefined
    } else {
      return parameter(param.label, param.name, param.type)
    }
  }).filter(code => typeof code != 'undefined').join(', ')}) {`
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
  if (type[type.length - 1] == '?') {
    return `${convertType(type.replace(/\?$/, ''))}?`
  }
  if (type instanceof Type) {
    if (type.isEnum) {
      // @ts-ignore
      return `${type.owner.name.classify()}Value`
    } else {
      return convertType(type.definition)
    }
  }
  if (type instanceof Entity) {
    return convertType(type.name)
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
    const hasBlockSignature = /^(?:(public|open|internal|private|fileprivate|final)(?:\(set\))?\s+)*(var|let|struct|class|init|deinit|func|protocol|typealias|enum)/.test(line)
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
    ...context.config.swift.imports.map(name => `import ${name}`),
    this.renderSwiftStruct(context),
  ].joinCode(), context.config || {})
}

Entity.prototype.renderSwiftStruct = function (context) {
  const nextContext = { entity: this, ...context }
  return [
    docc(this),
    classDef('public final', this.name, ...protocolMerge(context, 'entity', this.isWritable ? 'writer' : null)),
    ...this.readableFields.map(field => field.renderSwiftMember(nextContext)),
    ...this.fields.map(field => field.renderSwiftEnum(nextContext)),
    ...this.subtypes.map(subtype => subtype.renderSwiftStruct(nextContext)),
    defineIf(this.isWritable, () => {
      return [
        docc({ parameters: this.fields }),
        init('public', ...this.fields.map(field => field.renderArgumentSignature(nextContext))),
          ...this.fields.map(field => `self.${field.name.camelize()} = ${field.name.camelize()}`),
        end,
      ].joinCode()
    }),
    defineIf(this.requireWriter && !this.isWritable, () => this.writeOnly().renderSwiftStruct(nextContext)),
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

Field.prototype.renderSwiftMember = function (context = {}) {
  const { writer, entity } = context
  var scope = 'public'
  var type = this.type.resolveSwift(context)

  if (writer) {
    const reference = context.resolveReference(type)
    if (reference instanceof Entity && reference.requireWriter && reference.isWritable == false) {
      type = `${type}.Writer`
    }
    if (/^Array\<.+\>$/.test(type)) {
      const element = type.match(/^Array\<(.+)\>$/)[1]
      const reference = context.resolveReference(element)
      if (reference instanceof Entity && reference.requireWriter && reference.isWritable == false) {
        type = `Array<${element}.Writer>`
      }
    }
  }

  if (this.optional && type[type.length - 1] != '?') {
    type = `${type}?`
  }
  if (this.mutable == false) {
    return [
      docc(this),
      readOnlyMember(scope, this.name, type),
    ].joinCode()
  }

  if (writer || this.mutable) {
    return [
      docc(this),
      member(scope, this.name, type),
    ].joinCode()
  }

  if (entity && entity.requireWriter) {
    // If entity require writer, the user modify this field in Writer class instead Entity class.
    return [
      docc(this),
      readOnlyMember(scope, this.name, type),
    ].joinCode()
  }

  return [
    docc(this),
    member(scope, this.name, type),
  ].joinCode()

}

Field.prototype.renderArgumentSignature = function (context) {
  const { writer } = context
  var type = convertType(this.type)
  var defaultValue = ''
  if (writer) {
    const reference = context.resolveReference(type)
    if (reference instanceof Entity && reference.requireWriter && reference.isWritable == false) {
      type = `${type}.Writer`
    }
    if (/^Array\<.+\>$/.test(type)) {
      const element = type.match(/^Array\<(.+)\>$/)[1]
      const reference = context.resolveReference(element)
      if (reference instanceof Entity && reference.requireWriter && reference.isWritable == false) {
        type = `Array<${element}.Writer>`
      }
    }
    if (typeof this.defaultValue != 'undefined') {
      if (this.type.referenceName == 'String') {
        defaultValue = ` = "${this.defaultValue}"`
      } else {
        // [!] Integer, Number, Boolean
        defaultValue = ` = ${this.defaultValue}`
      }
    } else if (this.type.isOptional) {
      defaultValue = ` = nil`
    }
  }
  if (this.optional && type[type.length - 1] != '?') {
    type = `${type}?`
  }
  return `${this.name.camelize()}: ${type}${defaultValue}`
}

Field.prototype.renderSwiftEnum = function (context) {
  if (!this.isSelfDefinedEnum) { return null }
  var type = convertType(this.type)
  return [
    `public enum ${type.replace(/\?$/, '')}Value: String, Codable {`,
    ...this.enumValues.map(value => `case ${value.camelize()} = "${value}"`),
    '}',
  ].joinCode()
}

Endpoint.prototype.renderSwiftStruct = function (context) {
  return [
    docc(this),
    struct('public', this.signature, ...protocolMerge(context, 'endpoint')),

    docc(`${this.signature}.path: \`${this.path}\``),
    readOnlyMember('public', 'path', 'String'),

    docc(`${this.signature}.method: \`${this.method}\``),
    readOnlyMember('public', 'method', 'String', `"${this.method}"`),

    ...this.query.map(query => query.renderSwiftMember(context)),
    ...this.query.map(query => query.renderSwiftEnum(context)),

    defineIf(this.allowBody, () => readOnlyMember('public', 'body', 'RequestBody')),

    ...this.resolvePathParameters().map(parameter => parameter.renderSwiftEnum(context)),

    docc({ parameters: this.resolvePathParameters() }),
    init('public', ...this.resolvePathParameters(), this.requestBody.renderInitParam()),
      `self.path = "${this.path}"`,
      ...this.resolvePathParameters().map(parameter => `.replacingOccurrences(of: "${parameter.token}", with: ${parameter.renderSwiftStringifyToken()})`),
      defineIf(this.allowBody, () => 'self.body = body()'),
    end,

    this.requestBody.renderSwiftStruct(context),
    this.successResponse.renderSwiftStruct(context),

    end,
  ].joinCode()
}

Query.prototype.renderSwiftMember = function (context) {
  var type = convertType(this.type)
  var defaultValue = this.defaultValue
  if (this.optional) {
    type = `${type}?`
  }
  if (defaultValue && this.type.definition == 'String') {
    defaultValue = `"${defaultValue}"`
  }
  if (defaultValue && this.isEnum) {
    defaultValue = `.${defaultValue}`
  }
  if (typeof defaultValue == 'undefined') {
    defaultValue = 'nil'
  }
  return `public var ${this.name}: ${type} = ${defaultValue}`
}

Query.prototype.renderSwiftEnum = function (context) {
  if (!this.isSelfDefinedEnum) { return null }
  var type = convertType(this.type)
  return `public enum ${type}: String { case ${this.enumValues.join(', ')} }`
}

Parameter.prototype.renderArgumentSignature = function (context) {
  const { writer } = context
  var type = convertType(this.type)
  if (this.isSelfDefinedEnum) {
    type = convertType(this.name.classify())
  }
  if (writer) {
    const reference = context.resolveReference(type)
    if (reference instanceof Entity && reference.requireWriter) {
      type = `${type}.Writer`
    }
    if (/^Array\<.+\>$/.test(type)) {
      const element = type.match(/^Array\<(.+)\>$/)[1]
      const reference = context.resolveReference(element)
      if (reference instanceof Entity && reference.requireWriter) {
        type = `Array<${element}.Writer>`
      }
    }
  }
  if (this.optional) {
    type = `${type}?`
  }
  return `${this.name.camelize()}: ${type}`
}

Parameter.prototype.renderSwiftEnum = function (context) {
  if (!this.isSelfDefinedEnum) { return null }
  return `public enum ${this.name.classify()}Value: String { case ${this.enumValues.map(value => `\`${value}\``).join(', ')} }`
}

Parameter.prototype.renderSwiftStringifyToken = function () {
  if (this.isEnum) {
    return `${this.name.camelize()}.rawValue`
  }
  if (this.type.definition == 'Integer') {
    return `"\\(${this.name.camelize()})"`
  }
  return this.name.camelize()
}

RequestBody.prototype.renderInitParam = function (context) {
  if (this.fields.length == 0) { return undefined }
  return 'body: () -> RequestBody'
}

RequestBody.prototype.renderSwiftStruct = function (context) {
  if (typeof this.schema == 'string') {
    const { mime } = context.config.swift
    const mimeTypeValue = this.schema.replace(/^mime:/, '')
    if (typeof mime != undefined && mime[mimeTypeValue]) {
      return `public typealias RequestBody = ${mime[mimeTypeValue]}`
    }
    if (mimeTypeValue == 'application/json') { return 'public typealias RequestBody = Data' }
    if (/^image\/(jpe?g|gif|png|webp|bmp)$/.test(mimeTypeValue)) { return 'public typealias RequestBody = Data' }
    if (/^text\/(plain|html)$/.test(mimeTypeValue)) { return 'public typealias RequestBody = String' }
    throw new UnsupportedKeywordError(`Unsupported mime-type: ${mimeTypeValue}`)
  }

  if (this.fields.length == 0) { return 'public var body: Void' }

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

  if (typeof this.schema == 'string') {
    const { mime } = context.config.swift
    const mimeTypeValue = this.schema.replace(/^mime:/, '')
    if (typeof mime != undefined && mime[mimeTypeValue]) {
      return `public typealias Response = ${mime[mimeTypeValue]}`
    }
    if (mimeTypeValue == 'application/json') { return 'public typealias Response = Data' }
    if (/^image\/(jpe?g|gif|png|webp|bmp)$/.test(mimeTypeValue)) { return 'public typealias Response = Data' }
    if (/^text\/(plain|html)$/.test(mimeTypeValue)) { return 'public typealias Response = String' }
    throw new UnsupportedKeywordError(`Unsupported mime-type: ${mimeTypeValue}`)
  }

  const parameters = this.resolveParameters(context)
  return [
    docc(this),
    struct('public', 'Response', ...protocolMerge(context, 'response')),

    ...parameters.map(parameter => readOnlyMember('public', parameter.name, convertType(parameter.type))),

    end,
  ].joinCode()
}

const SWIFT_TYPE_TABLE = {
  'String': 'String',
  'Integer': 'Int',
  'Number': 'Double',
  'Boolean': 'Bool',
  'URL': 'URL',
  'Date': 'Date',
  'Timestamp': 'Date',
}

Type.prototype.resolveSwift = function (context) {
  return convertType(this)
}

export default { docc, struct, member, pretty, end, convertType }