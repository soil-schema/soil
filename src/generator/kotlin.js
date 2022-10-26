import Endpoint from '../graph/Endpoint.js'
import Entity from '../graph/Entity.js'
import Field from '../graph/Field.js'
import Node from '../graph/Node.js'
import Parameter from '../graph/Parameter.js'
import RequestBody from '../graph/RequestBody.js'
import Response from '../graph/Response.js'
import Type from '../graph/Type.js'
import Writer from '../graph/Writer.js'

import '../extension.js'
import Query from '../graph/Query.js'

const USE_KOTLIN_SERIALIZATION = 'kotlin-serialization'

const pretty = (code, config) => {
  const lines = code.split('\n')
  const { indent = '    ' } = config.kotlin
  var isImports = true
  var result = []
  var indentLevel = 0
  var annotationBuffer = []
  var commentBuffer = []
  var blockComment = false
  var inParameters = false
  for (var line of lines) {
    line = line.trim()
    if (isImports && line.startsWith('package ')) {
      result.push(line)
      result.push('')
      continue
    }
    if (isImports && line.startsWith('import ')) {
      result.push(line)
      continue
    }
    if (line == '') continue
    if (line.startsWith('///')) {
        commentBuffer.push(`${indent.repeat(indentLevel)}${line}`)
        continue
    }
    if (blockComment == false && line.startsWith('/*')) {
      blockComment = true
      commentBuffer.push(`${indent.repeat(indentLevel)}${line}`)
      continue
    }
    if (blockComment) {
      commentBuffer.push(`${indent.repeat(indentLevel)} ${line}`)
      if (/\*\/$/.test(line)) blockComment = false
      continue
    }
    if (line.startsWith('@')) {
      annotationBuffer.push(`${indent.repeat(indentLevel)}${line}`)
      continue
    }
    const hasBlockSignature = /^(?:((public)\s+)?(override\s+)?(var|val|((data|inner)\s+)?class|fun))\b/.test(line)
    if (hasBlockSignature) {
        if (inParameters == false) result.push('')
        result.push(...commentBuffer)
        result.push(...annotationBuffer)
    }
    if (line.startsWith('.')) {
      indentLevel += 1
    }
    if (line.startsWith('}')) {
      indentLevel -= 1
    }
    if (line.startsWith(')')) {
      indentLevel -= 1
      inParameters = false
    }
    if (indentLevel < 0) {
      console.log(result.join('\n'))
    }
    result.push(`${indent.repeat(indentLevel)}${line}`)
    if (/ {(\s\/\/.+)?$/.test(line) || / ->(\s\/\/.+)?$/.test(line)) {
      indentLevel += 1
    }
    if (line.endsWith('(')) {
      indentLevel += 1
      inParameters = true
    }
    if (line.startsWith('.')) {
      indentLevel -= 1
    }
    annotationBuffer = []
    commentBuffer = []
  }
  return result.join('\n')
}

const srcUrl = import.meta.url.replace(/\/generator\/kotlin\.js$/, '')

const trailMeta = function ({ meta }, depth = 2) {
  if (meta != true) { return '' }
  try {
    const stack = Error().stack
      .split(/\r?\n/)[depth]
      .replace(/\s+at\s+/, '')
      .match(/^(?:(?<function>.+)\s)?\(?(?<url>(file:\/\/)?[^:]+):(?<line>\d+):\d+\)?$/)
    return ` // ${stack.groups.function || '*'} ${stack.groups.url.replace(srcUrl, '.')}:${stack.groups.line}`
  } catch (error) {
    console.error(error.stack)
    return ' // ' + error.message
  }
}

Node.prototype.trailMeta = function() {
  return trailMeta(this.config.generate, 3)
}

const innerMeta = function ({ meta }, depth = 2) {
  if (meta != true) { return '' }
  try {
    const stack = Error().stack
      .split(/\r?\n/)[depth]
      .replace(/\s+at\s+/, '')
      .match(/^(?:(?<function>.+)\s)?\(?(?<url>(file:\/\/)?[^:]+):(?<line>\d+):\d+\)?$/)
    return ` /* ${stack.groups.function || '*'} ${stack.groups.url.replace(srcUrl, '.')}:${stack.groups.line} */`
  } catch (error) {
    console.error(error.stack)
    return ` /* ${error.message} */`
  }
}

Node.prototype.innerMeta = function() {
  return innerMeta(this.config.generate, 3)
}

/*
  ================================
  Kotlin Source Code Renderer Extensions
 */

Node.prototype.kt_DocComment = function (config) {
  if (typeof this.summary != 'string') return ''
  var comments = [this.summary]
  if (this.description) {
    comments.push('')
    comments.push(this.description.replace('\n', '\n * '))
  }
  return `
/**
 * ${comments.join('\n * ')}
 */
`
}

Node.prototype.kt_Formatter = function (config) {
  const { use, serialization } = config

  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1 && serialization.format) {
    return serialization.format
  }

  return 'SoilFormatter /* Unknown formatter, check soil.config.js */'
}

// ======== Entity

Entity.prototype.renderKotlinFile = function ({ config }) {
  const { kotlin } = config
  return pretty([
    this.ktPackage(),
    this.kt_Imports(kotlin),
    this.kt_DataClass(kotlin),
  ].joinCode(), config)
}

Entity.prototype.ktPackage = function () {
  const packageName = this.config.kotlin.package
  if (typeof packageName == 'string') {
    return `package ${packageName}${this.trailMeta()}\n\n`
  }
  return ''
}

Entity.prototype.kt_Imports = function () {
  const { use, imports } = this.config.kotlin
  var result = imports.map(name => `import ${name}${this.trailMeta()}`)

  // Delegates use at non-required query to use didSet like code block with Delegates.observable
  result.push(`import kotlin.properties.Delegates${this.trailMeta()}`)
  
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    result.push(`import kotlinx.serialization.*${this.trailMeta()}`)
  }
  if (use.indexOf('kotlin-serialization-json') != -1) {
    result.push(`import kotlinx.serialization.json.*${this.trailMeta()}`)
  }
  return result.joinCode()
}

Entity.prototype.kt_DataClass = function (config) {
  var classDef = [
    `data class ${this.name}(`,
      this.kt_Initializer(config),
    ') {',
  ]
  if (this.fields.length == 0) {
    classDef = [`class ${this.name} {${this.trailMeta()}`]
  }
  return [
    this.kt_DocComment(config),
    this.kt_Annotation(config),
    '@Suppress("unused")',
    ...classDef,
    this.kt_Writer(config),
    ...this.fields.map(field => field.kt_Enum()),
    this.kt_InnerType(config),
    this.kt_Endpoints(config),
    '}',
  ].joinCode()
}

Entity.prototype.kt_Annotation = function (config) {
  const { use, serialization } = config

  let annotations = []

  // Use 'kotlin-serialization'
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    annotations.push('@Serializable')
  }

  // No field annotation
  return annotations.joinCode()
}

Entity.prototype.kt_Initializer = function (config) {
  return this.fields.map(field => field.kt_DataClassParameter(config)).joinParameter(',\n')
}

Entity.prototype.kt_Writer = function (config) {
  return this.isWritable ? this.writeOnly().kt_DataClass(config) : null
}

Entity.prototype.kt_InnerType = function (config) {
  return this.subtypes.map(subtype => subtype.kt_DataClass(config)).joinCode()
}

Entity.prototype.kt_Endpoints =  function (config) {
  return [
    ...this.endpoints.map(endpoint => endpoint.kt_Definition(config))
  ].joinCode()
}

Field.prototype.kt_DataClassParameter = function (config) {
  return `${this.kt_Annotation(config)}${this.kt_Attribute()} ${this.name.camelize()}: ${this.type.kt_TypeArgument()}${this.kt_DefaultValue()}`
}

Field.prototype.kt_Annotation = function (config) {
  const { use } = config

  let annotations = []

  // Use 'kotlin-serialization' and mismatch between kotlin field name and api field name.
  // @see https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/basic-serialization.md#serial-field-names
  if (use.indexOf('kotlin-serialization') != -1 && this.name != this.name.camelize()) {
    annotations.push(`@SerialName("${this.name}")`)
  }

  // Use 'kotlin-serialization'
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    // Timestamp -> java.time.LocalDateTime, and apply custom serializer.
    if (this.type.definitionBody == 'Timestamp') {
      annotations.push(`@Serializable(with = TimestampAsStringSerializer::class)`)
    }
    // URL -> java.net.URL, and apply custom serializer.
    if (this.type.definitionBody == 'URL') {
      annotations.push(`@Serializable(with = UrlAsStringSerializer::class)`)
    }
  }

  if (annotations.length == 0) {
    return ''
  } else {
    return annotations.joinCode() + '\n'
  }
}

Field.prototype.kt_Attribute = function () {
  return this.mutable ? 'var' : 'val'
}

Field.prototype.kt_DefaultValue = function () {
  if (typeof this.defaultValue == 'undefined') return ''
  if (typeof this.defaultValue == 'string') {
    switch (this.type.referencePath) {
      case 'String':
        return ` = "${this.defaultValue}"`
      case 'Integer':
      case 'Number':
        return ` = ${this.defaultValue}`
      case 'Boolean':
        return this.defaultValue ? ' = true' : ' = false'
    }
  }
  return` = ${this.defaultValue}`
}

Writer.prototype.kt_DataClass = function (config) {
  return `
${this.kt_Annotation(config)}
data class Writer(
  ${this.kt_InitializerParameters(config)}
) {}`
}

Writer.prototype.kt_Annotation = function (config) {
  const { use, annotations } = config

  var result = []

  if (annotations.writer) {
    result.push(annotations.writer)
  }

  // Use 'kotlin-serialization'
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    result.push('@Serializable')
  }

  // No field annotation
  return result.joinCode()
}

Writer.prototype.kt_InitializerParameters = function (config) {
  return this.fields.map(field => field.kt_DataClassParameter(config)).joinParameter(',\n')
}

Endpoint.prototype.kt_Definition = function (config) {
  return [
    `class ${this.signature}${this.kt_Initializer()}: ApiEndpoint<${this.kt_ResponseType()}> {`,
    `override val path: String = "${this.kt_ParameterizedPath()}"`,
    `override val method: String = "${this.method.toUpperCase()}"`,
    ...this.query.map(field => field.kt_Enum()),
    this.kt_QueryData(config),
    this.kt_QueryMembers(config),
    this.kt_FunGetBody(config),
    this.kt_FunDecode(config),
    this.kt_Request(config),
    this.kt_Response(config),
    '}',
  ].joinCode()
}

Endpoint.prototype.kt_ResponseType = function () {
  if (this.successResponse.schema == null) {
    return 'Unit'
  }

  if (typeof this.successResponse.schema.mime == 'string') {
    const { mime } = this.config.api
    const mimeTypeValue = this.successResponse.schema.mime.replace(/^mime:/, '')
    if (typeof mime != undefined && mime[mimeTypeValue]) {
      return `${mime[mimeTypeValue]}`
    }
    if (mimeTypeValue == 'application/json') { return 'String' }
    if (/^image\/(jpe?g|gif|png|webp|bmp)$/.test(mimeTypeValue)) { return 'Data' }
    if (/^text\/(plain|html)$/.test(mimeTypeValue)) { return 'String' }
    throw new UnsupportedKeywordError(`Unsupported mime-type: ${mimeTypeValue}`)
  }

  return `${this.signature}.Response`
}

Endpoint.prototype.kt_Initializer = function (config) {
  if (this.pathParameters.length == 0 && this.query.length == 0 && this.hasRequestBody == false) {
    return ''
  } else {
    return `(\n${this.kt_InitializerParameters(config)}\n)`
  }
}

Endpoint.prototype.kt_InitializerParameters = function () {
  return []
    .concat(this.pathParameters.map(parameter => parameter.kt_EndpointClassParameter()))
    .concat(this.query.filter(query => query.isRequired).map(query => query.kt_EndpointClassParameter()))
    .concat(this.hasRequestBody ? [`val body: () -> RequestBody`] : [])
    .joinParameter(',\n')
}

Endpoint.prototype.kt_ParameterizedPath = function () {
  return this.pathParameters.reduce((path, parameter) => path.replace(`$${parameter.name}`, parameter.kt_Stringify()), this.path)
}

Endpoint.prototype.kt_QueryData = function () {
  if (this.query.length == 0) return null
  if (this.query.filter(query => query.isRequired).length == 0) {
    return `override var queryData: MutableMap<String, String> = mutableMapOf()`
  } else {
    return [
      `override var queryData: MutableMap<String, String> = mutableMapOf(`,
      ...this.query.filter(query => query.isRequired).map(query => query.kt_MutableListMember()),
      ')',
    ].joinCode()
  }
}

Endpoint.prototype.kt_QueryMembers = function () {
  if (this.query.length == 0) return null
  return this.query.map(query => query.kt_EndpointMember()).joinCode()
}

Endpoint.prototype.kt_FunGetBody = function (config) {
  const { use, serialization } = config

  let annotations = []

  if (use.includes(USE_KOTLIN_SERIALIZATION)) {
    // [!] StringFormat is not stable, should set @ExperimentalSerializationApi annotation.
    // @see https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-core/kotlinx.serialization/-string-format/
    if (serialization.format == 'StringFormat') {
      annotations.push('@ExperimentalSerializationApi')
    }

    if (this.hasRequestBody) {
      return `${annotations.joinCode()}\noverride fun getBody(formatter: ${this.kt_Formatter(config)}): String? = formatter.encodeToString(body())`
    } else {
      return `${annotations.joinCode()}\noverride fun getBody(formatter: ${this.kt_Formatter(config)}): String? = null`
    }
  }

  return [
    '// get body function is unknown, please add serialization package on your soil.config.js',
    '// for example: insert "kotlin-serialization" into `kotlin.use`',
    'override func getBody(): String? = null'
  ].joinCode()
}

Endpoint.prototype.kt_FunDecode = function (config) {
  const { use, serialization } = config

  let annotations = []

  if (typeof this.successResponse.schema?.mime == 'string') {
    const { mime } = this.config.api
    const mimeTypeValue = this.successResponse.schema.mime.replace(/^mime:/, '')
    if (typeof mime != undefined && mime[mimeTypeValue]) {
      return `${mime[mimeTypeValue]}`
    }
    if (mimeTypeValue == 'application/json') { return `override fun decode(formatter: ${this.kt_Formatter(config)}, body: String): Response = body /* JSON String */` }
    // if (/^image\/(jpe?g|gif|png|webp|bmp)$/.test(mimeTypeValue)) { return 'Data' }
    if (/^text\/(plain|html)$/.test(mimeTypeValue)) { return `override fun decode(formatter: ${this.kt_Formatter(config)}, body: String): Response = body` }
    throw new UnsupportedKeywordError(`Unsupported mime-type: ${mimeTypeValue}`)
  }

  if (use.includes(USE_KOTLIN_SERIALIZATION)) {
    // [!] StringFormat is not stable, thereforeinsert @ExperimentalSerializationApi annotation.
    // @see https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-core/kotlinx.serialization/-string-format/
    if (serialization.format == 'StringFormat') {
      annotations.push('@ExperimentalSerializationApi')
    }
  
    if (this.hasResponse) {
      return `${annotations.joinCode()}\noverride fun decode(formatter: ${this.kt_Formatter(config)}, body: String): Response = formatter.decodeFromString(body)`
    } else {
      return `${annotations.joinCode()}\noverride fun decode(formatter: ${this.kt_Formatter(config)}, body: String): Unit = Unit`
    }
  }
  return '// No decode method.'
}

Endpoint.prototype.kt_Request = function (config) {
  if (this.hasRequestBody == false) {
    return ''
  } else {
    return this.requestBody.kt_DataClass(config)
  }
}

Endpoint.prototype.kt_Response = function (config) {
  if (typeof this.successResponse == 'undefined' || this.successResponse.schema == null) {
    return null
  } else {
    return this.successResponse.kt_DataClass(config)
  }
}

Parameter.prototype.kt_EndpointClassParameter = function () {
  return `val ${this.name.camelize()}: ${this.type.kt_TypeArgument()}`
}

Parameter.prototype.kt_Stringify = function () {
  return `$\{${this.name.camelize()}\}`
}

Query.prototype.kt_EndpointClassParameter = function () {
  return `${this.name.camelize()}: ${this.type.kt_TypeArgument()}`
}

Query.prototype.kt_EndpointMember = function () {
  return [
    this.trailMeta(),
    `var ${this.name.camelize()}: ${this.kt_TypeDefinition()} by Delegates.observable(${this.kt_DefaultValue()}) { _, _, new ->`,
    this.kt_Observer(),
    '}',
  ].joinCode()
}

Query.prototype.kt_TypeDefinition = function () {
  var type = this.isRequired ? this.type : this.type.toOptional()
  var type = type.kt_TypeDefinition()

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

  return type
}

Query.prototype.kt_DefaultValue = function () {
  if (this.isRequired) {
    // Set query value in Endpoint constructor with camelize named variable.
    return this.name.camelize()
  } else {
    // non-required query initial valie is always `null`.
    return 'null'
  }
}

Query.prototype.kt_Observer = function () {
  var removalHelper = !this.isRequired
  var valueCode = removalHelper ? "it" : "new"
  var setCode = `queryData["${this.name}"] = ${valueCode}${this.innerMeta()}`
  if (this.type.definitionBody == 'Boolean') {
    const { booleanQuery } = this.config.api
    if (['set-only-ture', 'only-key'].includes(booleanQuery)) { // Remove key when false
    }
    const valueCodeTable = {
      // true sets query value 1, false sets query value 0.
      'numeric': `queryData["${this.name}"] = if (${valueCode}) "1" else "0"${this.trailMeta()}`,
      // Boolean value convert to string like "true" or "false".
      'stringify': `queryData["${this.name}"] = if (${valueCode}) ? "true" else "false"${this.trailMeta()}`,
      // true sets query value 1, but false remove key from query string. (add removing helper)
      'set-only-true': `if (${valueCode}) { queryData["${this.name}"] = "1" } else { queryData.remove("${this.name}") }${this.trailMeta()}`,
      // true sets key but no-value likes `?key`. false remove key from query string. (add removing helper)
      'set-only-true': `if (${valueCode}) { queryData["${this.name}"] = "" } else { queryData.remove("${this.name}") }${this.trailMeta()}`,
    }
    setCode = valueCodeTable[booleanQuery]
  }
  if (this.type.definitionBody == 'Integer') {
    setCode = `queryData["${this.name}"] = ${valueCode}.toString()${this.innerMeta()}`
  }
  if (this.type.definitionBody == 'Number') {
    setCode = `queryData["${this.name}"] = ${valueCode}.toString()${this.innerMeta()}`
  }
  if (this.type.isSelfDefinedEnum) {
    setCode = `queryData["${this.name}"] = ${valueCode}.rawValue${this.innerMeta()}`
  }
  if (this.type.isReference) {
    const reference = this.resolve(this.type.definitionBody)
    if (reference instanceof Field) {
      if (reference.type.isSelfDefinedEnum) {
        setCode = `queryData["${this.name}"] = ${valueCode}.rawValue${this.innerMeta()}`
      }
    }
  }
  if (removalHelper) {
    return [
      `new?.let { ${setCode} } ?: queryData.remove("${this.name}")${this.innerMeta()}`,
    ].joinCode()
  } else {
    return [
      setCode
    ].joinCode()
  }
}

Query.prototype.kt_SetQueryData = function () {
  if (this.isRequired) {
    return `queryData["${this.name}"] = ${this.name.camelize()}`
  } else {
    return ``
  }
}

Query.prototype.kt_MutableListMember = function () {
  return `"${this.name}" to ${this.kt_Stringify()},${this.trailMeta()}`
}

Query.prototype.kt_Stringify = function () {
  switch (this.type.definitionBody) {
    case "String":
      return `${this.name.camelize()}${this.innerMeta()}`
    case "Integer":
    case "Number":
      return `${this.name.camelize()}.toString()${this.innerMeta()}`
  }

  var type = this.type.kt_TypeDefinition()

  if (this.type.isSelfDefinedEnum) {
    return `${this.name.camelize()}.rawValue${this.innerMeta()}`
  }

  if (this.type.isReference) {
    const reference = this.resolve(this.type.definitionBody)
    if (reference instanceof Field) {
      if (reference.type.isSelfDefinedEnum) {
        return `${this.name.camelize()}.rawValue${this.innerMeta()}`
      }
    }
  }

  return `${this.name.camelize()}${this.innerMeta()}`
}

RequestBody.prototype.kt_DataClass = function (config) {
  return `
${this.kt_Annotation(config)}
data class RequestBody(
  ${this.kt_InitializerParameters(config)}
)
`
}

RequestBody.prototype.kt_Annotation = function (config) {
  const { use, annotations } = config

  var result = []

  if (annotations.request) {
    result.push(annotations.request)
  }

  // Use 'kotlin-serialization'
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    result.push('@Serializable')
  }

  // No field annotation
  return result.joinCode()
}

RequestBody.prototype.kt_HighOrderFunctionParameter = function (config) {
  return `body: (${this.kt_HighOrderFunctionParameters(config)}) -> RequestBody`
}

RequestBody.prototype.kt_HighOrderFunctionParameters = function (config) {
  return this.fields.map(field => `${field.name.camelize()}: ${field.type.kt_TypeArgument()}`).join(', ')
}

RequestBody.prototype.kt_InitializerParameters = function (config) {
  return this.fields.map(field => field.kt_DataClassParameter(config)).joinParameter(',\n')
}

Response.prototype.kt_DataClass = function (config) {
  if (typeof this.schema.mime == 'string') {
    return ''
  }

  return `
${this.kt_Annotation(config)}
data class Response(
  ${this.kt_InitializerParameters(config)}
)
`
}

Response.prototype.kt_Annotation = function (config) {
  const { use, annotations } = config

  var result = []

  if (annotations.response) {
    result.push(annotations.response)
  }

  // Use 'kotlin-serialization'
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    result.push('@Serializable')
  }

  // No field annotation
  return result.joinCode()
}

Response.prototype.kt_InitializerParameters = function (config) {
  return this.fields.map(field => field.kt_DataClassParameter(config)).joinParameter(',\n')
}

Type.prototype.kt_TypeArgument = function () {
  return `${this.kt_TypeDefinition()}${this.isOptional ? '?' : ''}`
}

Type.prototype.kt_TypeDefinition = function () {
  var type = this.definitionBody
  console.log(this.definitionBody)
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
      case 'Timestamp':
        type = 'java.time.LocalDateTime'
        break
      case 'URL':
        type = 'java.net.URL'
        break
      default:
        break
    }
  }
  if (this.isList) {
    type = `List<${type}>`
  }
  return type
}

// Enum

/**
 * Kotlin Enum
 * @returns 
 */
 const kt_Enum = function () {
  if (!this.isSelfDefinedEnum) { return null }
  var type = `${this.name.classify()}Value`
  return [
    `enum class ${type.replace(/\?$/, '')}(val rawValue: String) {`,
    ...this.enumValues.map(value => `${value.toUpperCase().replace('-', '_')}("${value}"),`),
    '}',
  ].joinCode()
}
Field.prototype.kt_Enum = kt_Enum
Query.prototype.kt_Enum = kt_Enum
Parameter.prototype.kt_Enum = kt_Enum
