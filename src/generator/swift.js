import UnsupportedKeywordError from '../errors/UnsupportedKeywordError.js'
import Endpoint from '../graph/Endpoint.js'
import Entity from '../graph/Entity.js'
import Field from '../graph/Field.js'
import Parameter from '../graph/Parameter.js'
import Query from '../graph/Query.js'
import RequestBody from '../graph/RequestBody.js'
import Response from '../graph/Response.js'
import Type from '../graph/Type.js'
import Writer from '../graph/Writer.js'

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
  if (type instanceof Field) {
    return type.swift_Type()
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
  const { indent = '    ' } = config.swift
  var result = []
  var indentLevel = 0
  var commentBuffer = []
  for (var line of lines) {
    if (line.startsWith('///')) {
        commentBuffer.push(`${indent.repeat(indentLevel)}${line}`)
        continue
    }
    const hasBlockSignature = /^(?:@[A-Z][a-zA-Z]+ +)?(?:(public|open|internal|private|fileprivate|final)(?:\(set\))?\s+)*(var|let|struct|class|init|deinit|func|protocol|typealias|enum)\b/.test(line)
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
    if (indentLevel < 0) {
      console.log(`Invalid indent level`, result)
    }
    result.push(`${indent.repeat(indentLevel)}${line}`)
    if (line.endsWith('{')) {
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

/*
  ================================
  Swift Source Code Renderer Extensions
 */

Entity.prototype.renderSwiftFile = function (context) {
  return pretty([
    this.swift_Imports(),
    this.swift_Struct(context),
  ].joinCode(), this.config || {})
}

Entity.prototype.swift_Imports = function () {
  const { swift } = this.config
  const { use, imports } = swift

  var result = imports.map(name => name)

  if (use.includes('soil-swift') && result.includes('SoilSwift') == false) {
    result.push('SoilSwift')
  }

  return result.map(name => `import ${name}`).joinCode()
}

Entity.prototype.swift_Struct = function (context) {
  const nextContext = { entity: this, ...context }
  return [
    docc(this),
    classDef('public final', this.name, ...this.swift_Protocols()),
    ...this.readableFields.map(field => field.swift_Member(nextContext)),
    ...this.fields.map(field => field.swift_Enum(nextContext)),
    this.swift_DecodableInit(),
    ...this.subtypes.map(subtype => subtype.swift_Struct(nextContext)),
    defineIf(this.isWritable, () => {
      return [
        docc({ parameters: this.fields }),
        init('public', ...this.fields.map(field => field.swift_ArgumentSignature(nextContext))),
          ...this.fields.map(field => `self.${field.name.camelize()} = ${field.name.camelize()}`),
        end,
      ].joinCode()
    }),
    defineIf(this.requireWriter && !this.isWritable, () => this.writeOnly().swift_Struct(nextContext)),
    ...this.endpoints.map(endpoint => endpoint.swift_Struct(nextContext)),
    end,
  ].joinCode()
}

Entity.prototype.swift_Protocols = function () {
  const { observable } = this.config?.swift || {}

  var protocols = [this.config?.swift?.protocols?.entity]

  if (this.isWritable) {
    protocols.push(this.config?.swift?.protocols?.writer)
  }

  if (observable && this.hasMutableField) {
    // If swift.observable config is true, uses ObservableObject
    // @see https://developer.apple.com/documentation/combine/observableobject
    protocols.push('ObservableObject')
  }

  // Encodable & Decodable -> Codable
  if (protocols.indexOf('Decodable') != -1 && protocols.indexOf('Encodable') != -1) {
    protocols = protocols
      .filter(protocol => protocol != 'Decodable' && protocol != 'Encodable')
    protocols.push('Codable')
  }

  return protocols
    .filter(protocol => typeof protocol == 'string')
}

Writer.prototype.swift_Struct = function (context) {
  const nextContext = { ...context, writer: this }
  return [
    classDef('public', 'Writer', ...this.swift_Protocols()),
    ...this.fields.map(field => field.swift_Member(nextContext)),
    docc({ parameters: this.fields }),
    init('public', ...this.fields.map(field => field.swift_ArgumentSignature(nextContext))),
      ...this.fields.map(field => `self.${field.name.camelize()} = ${field.name.camelize()}`),
    end,
    end,
  ].joinCode()
}

Writer.prototype.swift_Protocols = function () {
  const { observable } = this.config?.swift || {}

  var protocols = [this.config?.swift?.protocols?.writer]

  if (observable) {
    // If swift.observable config is true, uses ObservableObject
    // @see https://developer.apple.com/documentation/combine/observableobject
    protocols.push('ObservableObject')
  }

  // Encodable & Decodable -> Codable
  if (protocols.includes('Decodable') && protocols.includes('Encodable')) {
    protocols = protocols
      .filter(protocol => protocol != 'Decodable' && protocol != 'Encodable')
    protocols.push('Codable')
  }

  return protocols
    .filter(protocol => typeof protocol == 'string')
}

Field.prototype.swift_Member = function (context = {}) {
  const { writer, entity } = context
  var type = this.swift_Type()
  var head = 'let'
  var propertyWrapper = ''

  var finder = this.type.definitionBody
  if (this.type.isSelfDefinedType) {
    finder = this.referencePath
  }
  const reference = this.resolve(finder)

  if (writer) {
    head = 'var'
    if (reference instanceof Entity && reference.requireWriter && reference.isWritable == false) {
      type = type.replace(this.referencePath, `${this.referencePath}.Writer`)
    }
  } else {
    if (reference instanceof Entity && reference.schema['swift-property-wrapper']) {
      propertyWrapper = `${reference.schema['swift-property-wrapper']} `
      head = 'var'
    }
    if (reference instanceof Field && reference.isSelfDefined) {
      type = reference.swift_Type()
      head = 'var'
      if (this.type.isList) {
        type = `Array<${type.replace(/\?$/, '')}>`
      }
    }
  }

  if (this.optional && type[type.length - 1] != '?') {
    type = `${type}?`
  }

  if ((typeof writer == 'undefined') && this.mutable) {
    head = 'var'
  }

  if (writer) {
    if (this.schema['swift-property-wrapper']) {
      propertyWrapper = `${this.schema['swift-property-wrapper']} `
      head = 'var'
    }
    const { observable } = this.config?.swift || {}
    if (this.mutable && propertyWrapper == '' && observable) {
      propertyWrapper = '@Published '
      head = 'var'
    }
  } else {
    if (this.schema['swift-property-wrapper']) {
      propertyWrapper = `${this.schema['swift-property-wrapper']} `
      head = 'var'
    }
    const { observable } = this.config?.swift || {}
    if (this.mutable && propertyWrapper == '' && observable) {
      propertyWrapper = '@Published '
      head = 'var'
    }
  }

  return [
    docc(this),
    `${propertyWrapper}public ${head} ${this.name.camelize()}: ${type}`,
  ].joinCode()
}

Field.prototype.swift_Type = function () {
  var type = this.type.swift_TypeDefinition()

  if (this.optional && type[type.length - 1] != '?') {
    type = `${type}?`
  }

  return type
}

Field.prototype.swift_ArgumentSignature = function (context) {
  const { writer } = context
  var type = this.type.swift_TypeDefinition()
  var defaultValue = ''
  if (writer) {
    var finder = this.type.definitionBody
    if (this.type.isSelfDefinedType) {
      finder = this.referencePath
    }
    const reference = this.resolve(finder)
    if (reference instanceof Entity && reference.requireWriter && reference.isWritable == false) {
      type = type.replace(this.referencePath, `${this.referencePath}.Writer`)
    }
    if (typeof this.defaultValue != 'undefined') {
      if (this.type.isSelfDefinedEnum) {
        defaultValue = ` = .${this.defaultValue}`
      } else if (this.type.definitionBody == 'String') {
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

Endpoint.prototype.swift_Struct = function (context) {
  return [
    docc(this),
    struct('public', this.signature, ...protocolMerge(context, 'endpoint')),

    docc(`${this.signature}.path: \`${this.path}\``),
    readOnlyMember('public', 'path', 'String'),

    docc(`${this.signature}.method: \`${this.method}\``),
    readOnlyMember('public', 'method', 'String', `"${this.method}"`),

    this.requestBody.swift_DataTypeMember(),

    this.swift_Queries(),

    defineIf(this.allowBody, () => readOnlyMember('public', 'body', 'RequestBody')),

    ...this.resolvePathParameters().map(parameter => parameter.swift_Enum(context)),

    docc({ parameters: this.resolvePathParameters() }),
    `public init(${this.swift_InitializerParameters()}) {`,
      `self.path = "${this.path}"`,
      ...this.resolvePathParameters().map(parameter => `.replacingOccurrences(of: "${parameter.token}", with: ${parameter.swift_StringifyToken()})`),
      this.swift_QueryInitializer(),
      this.requestBody.swift_InitializeCode(),
    end,

    this.requestBody.swift_Struct(context),
    this.successResponse.swift_Struct(context),

    end,
  ].joinCode()
}

Endpoint.prototype.swift_InitializerParameters = function () {
  return []
    .concat(this.pathParameters.map(parameter => parameter.swift_InitializeParameter()))
    .concat(this.query.filter(query => query.isRequired).map(query => query.swift_InitializeParameter()))
    .concat([this.requestBody.swift_InitializeParameter()])
    .joinCode(', ')
}

Endpoint.prototype.swift_Queries = function () {

  if (this.hasQuery == false) return ''

  var code = [
    'public private(set) var queryData: Dictionary<String, String> = [:]',
  ]

  this.query.forEach(query => code.push(query.swift_Member()))

  return code.joinCode()
}

Endpoint.prototype.swift_QueryInitializer = function () {
  return this.query.filter(query => query.isRequired)
    .map(query => `self.${query.name.camelize()} = ${query.name.camelize()}\nself.queryData["${query.name}"] = ${query.swift_StringifyValue()}`)
    .joinCode()
}

Query.prototype.swift_Member = function (context) {
  var type = this.isRequired ? this.type : this.type.toOptional()
  var type = type.swift_TypeDefinition()

  if (this.type.isSelfDefinedEnum) {
    type = `${this.name.classify()}Value`
  }

  if (this.type.isReference) {
    const reference = this.resolve(this.type.definitionBody)
    if (reference instanceof Field) {
      type = reference.fullName
      if (reference.type.isSelfDefinedEnum) {
        type = `${type}Value`
      }
    }
  }

  if (this.isRequired == false && !/\?$/.test(type)) {
    type = `${type}?`
  }

  var result = [
    `public var ${this.name.camelize()}: ${type}${this.isRequired ? '' : ' = nil'} {`,
    'didSet {',
    this.swift_RemoveHelper(),
  ]

  result.push(`self.queryData["${this.name}"] = ${this.swift_StringifyValue()}`, '}', '}', this.swift_Enum())

  return result.joinCode()
}

Query.prototype.swift_StringifyValue = function () {

  if (this.type.isSelfDefinedEnum) {
    return `${this.name.camelize()}.rawValue`
  }

  if (this.type.isReference) {
    const reference = this.resolve(this.type.definitionBody)
    if (reference instanceof Field && reference.type.isSelfDefinedEnum) {
      return `${this.name.camelize()}.rawValue`
    }
  }

  if (this.type.definitionBody == 'Boolean') {
    const { booleanQuery } = this.config.api
    if (booleanQuery == 'not-accepted') {
      throw new Error('config.api.booleanQuery is `not-accepted`, but use boolean query in your soil schema.\n@see https://github.com/niaeashes/soil/issues/32')
    }
    const valueCodeTable = {
      // true sets query value 1, false sets query value 0.
      'numeric': `${this.name.camelize()} ? "1" : "0"`,
      // Boolean value convert to string like "true" or "false".
      'stringify': `${this.name.camelize()} ? "true" : "false"`,
      // true sets query value 1, but false remove key from query string. (add removing helper)
      'set-only-true': '"1"',
      // true sets key but no-value likes `?key`. false remove key from query string. (add removing helper)
      'only-key': '""',
    }
    return valueCodeTable[booleanQuery]
  }

  if (this.type.isList && this.type.definitionBody == 'String') {
    return `${this.name.camelize()}.joined(separator: "+")`
  }

  if (this.type.definitionBody == 'Integer' || this.type.definitionBody == 'Number') {
    if (this.type.isList) {
      return `${this.name.camelize()}.map { "\\($0)" }.joined(separator: "+")`
    } else {
      return `"\\(${this.name.camelize()})"`
    }
  }

  return this.name.camelize()
}

Query.prototype.swift_RemoveHelper = function (context) {

  /**
   * If this is boolean query and config.api.booleanQuery is `set-only-true` or `only-key`,
   * insert boolean specialized removing helper.
   */
  if (this.type.definitionBody == 'Boolean') {
    const { booleanQuery } = this.config.api
    if (['set-only-true', 'only-key'].includes(booleanQuery)) { // Remove key when false
      return [
        `guard let ${this.name.camelize()} = ${this.name.camelize()}, ${this.name.camelize()} == true else {`,
          `self.queryData.removeValue(forKey: "${this.name}")`,
          'return',
        '}',
      ].joinCode()
    }
  }

  /**
   * If query is required only set to queryData,
   * but when it's optional require checking and removing key from queryData with nil.
   */
  if (this.isRequired == false) {
    return [
      `guard let ${this.name.camelize()} = ${this.name.camelize()} else {`,
        `self.queryData.removeValue(forKey: "${this.name}")`,
        'return',
      '}',
    ].joinCode()
  }

  return null
}

Query.prototype.swift_InitializeParameter = function () {
  return `${this.name.camelize()}: ${this.type.swift_TypeDefinition()}`
}

Parameter.prototype.swift_InitializeParameter = function (context) {
  return `${this.name.camelize()}: ${this.type.swift_TypeDefinition()}`
}

Parameter.prototype.swift_StringifyToken = function () {
  if (this.isEnum) {
    return `${this.name.camelize()}.rawValue`
  }
  if (this.type.definition == 'Integer') {
    return `"\\(${this.name.camelize()})"`
  }
  return this.name.camelize()
}

/**
 * If request body is defined struct, returns `undefined`.
 * @returns {string|undefined}
 */
 RequestBody.prototype.swift_DataType = function () {

  if (typeof this.schema.mime == 'string') {
    const { mime } = this.config.api
    const mimeTypeValue = this.schema.mime.replace(/^mime:/, '')
    if (typeof mime != undefined && mime[mimeTypeValue]) {
      return mime[mimeTypeValue]
    }
    if (mimeTypeValue == 'application/json') { return 'Data' }
    if (/^image\/(jpe?g|gif|png|webp|bmp)$/.test(mimeTypeValue)) { return 'Data' }
    if (/^text\/(plain|html)$/.test(mimeTypeValue)) { return 'String' }
    throw new UnsupportedKeywordError(`Unsupported mime-type: ${mimeTypeValue}`)
  }

  if (this.fields.length == 0) { return 'Void' }

  return void 0
}

RequestBody.prototype.swift_InitializeParameter = function (context) {
  const dataType = this.swift_DataType()
  if (dataType != 'Void') {
    return `body: ${this.swift_DataType() || '() -> RequestBody' }`
  } else {
    return null
  }
}

RequestBody.prototype.swift_InitializeCode = function () {
  const dataType = this.swift_DataType()
  if (dataType == 'Void') { return null }
  if (dataType) {
    return 'self.body = body'
  }
  return 'self.body = body()'
}

RequestBody.prototype.swift_Struct = function (context) {

  const type = this.swift_DataType()
  if (type) {
    return `public var body: ${type}`
  }

  const parameters = this.resolveParameters(context)
  return [
    docc(this),
    struct('public', 'RequestBody', ...protocolMerge(context, 'request')),

    ...parameters.map(parameter => readOnlyMember(null, parameter.name, convertType(parameter.type))),

    docc({ parameters }),
    init('public', ...parameters),
      ...parameters.map(parameter => `self.${parameter.name.camelize()} = ${parameter.name.camelize()}`),
    end,

    end,
  ].joinCode()
}

RequestBody.prototype.swift_DataTypeMember = function () {
  const { mimeTypeMember } = this.config.swift?.endpoint || {}
  if (mimeTypeMember === null) { return null }
  
  if (typeof this.schema.mime == 'string') {
    const mimeTypeValue = this.schema.mime.replace(/^mime:/, '')
    return [
      `public var ${mimeTypeMember}: String? { "${mimeTypeValue}" }`,
    ].joinCode()
  }
  return [
    `public var ${mimeTypeMember}: String? { nil }`,
  ].joinCode()
}

Response.prototype.swift_Struct = function (context) {
  if (this.schema == null) { return 'public typealias Response = Void' }

  if (typeof this.schema.mime == 'string') {
    const { mime } = this.config.api
    const mimeTypeValue = this.schema.mime.replace(/^mime:/, '')
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

    ...this.fields.map(field => readOnlyMember('public', field.name, field.type.swift_TypeDefinition())),

    end,
  ].joinCode()
}

const SWIFT_TYPE_TABLE = {
  'String': 'String',
  'Integer': 'Int',
  'Number': 'Double',
  'Boolean': 'Bool',
  'URL': 'URL',
  'Timestamp': 'Date',
}

Type.prototype.resolveSwift = function (context) {
  return convertType(this)
}

/**
 * Swift Enum
 * @returns 
 */
const swift_Enum = function (context) {
  if (!this.isSelfDefinedEnum) { return null }
  var type = `${this.name.classify()}Value`
  return [
    `public enum ${type.replace(/\?$/, '')}: String, Codable {`,
    ...this.enumValues.map(value => `case ${value.camelize()} = "${value}"`),
    '}',
  ].joinCode()
}
Field.prototype.swift_Enum = swift_Enum
Query.prototype.swift_Enum = swift_Enum
Parameter.prototype.swift_Enum = swift_Enum

/**
 * Return type definition for swift code.
 */
Type.prototype.swift_TypeDefinition = function () {
  var type = this.definitionBody
  if (this.isSelfDefinedType) {
    type = this.owner.name.classify()
  }
  if (this.isSelfDefinedEnum) {
    type = `${type}Value`
  }
  if (this.isPrimitiveType) {
    switch (type) {
      case 'Integer':
        type = 'Int'
        break
      case 'Number':
        type = 'Double'
        break
      case 'Boolean':
        type = 'Bool'
        break
      case 'Timestamp':
        type = 'Date'
        break
    } 
  }
  if (this.isList) {
    type = `Array<${type}>`
  }
  if (this.isMap) {
    type = `Dictionary<String, ${type}>`
  }
  if (this.isOptional) {
    type = `${type}?`
  }
  return type
}

// Decodable

Entity.prototype.swift_DecodableInit = function () {
  const { observable } = this.config?.swift || {}
  var codes = []

  if (observable && this.hasMutableField) {
    // ObservableObject has Published, but Published is not Decodable.
    codes.push(
      'enum CodingKeys: CodingKey {',
      ...this.fields.map(field => `case ${field.name.camelize()}`),
      '}',
      'public init(from decoder: Decoder) throws {',
      'let container = try decoder.container(keyedBy: CodingKeys.self)',
      ...this.readableFields.map(field => field.swift_Decode()),
      '}',
    )
  }

  return codes.joinCode()
}

Field.prototype.swift_Decode = function () {
  return `self.${this.name.camelize()} = try${this.type.isOptional ? '?' : ''} container.decode(${this.swift_Type()}.self, forKey: .${this.name.camelize()})`
}

export default { docc, struct, member, pretty, end, convertType }