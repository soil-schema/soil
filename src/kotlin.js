import Endpoint from './graph/Endpoint.js'
import Entity from './graph/Entity.js'
import Field from './graph/Field.js'
import Node from './graph/Node.js'
import Parameter from './graph/Parameter.js'
import RequestBody from './graph/RequestBody.js'
import Response from './graph/Response.js'
import Type from './graph/Type.js'
import Writer from './graph/Writer.js'

import './extension.js'
import Query from './graph/Query.js'

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
    result.push(`${indent.repeat(indentLevel)}${line}`)
    if (line.endsWith('{') || line.endsWith(' ->')) {
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
  const { use, serializable } = config

  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1 && serializable.format) {
    return serializable.format
  }

  return 'SoilFormatter /* Unknown formatter, check soil.config.js */'
}

Entity.prototype.renderKotlinFile = function ({ config }) {
  const { kotlin } = config
  return pretty([
    this.ktPackage(kotlin),
    this.kt_Imports(kotlin),
    this.kt_DataClass(kotlin),
  ].joinCode(), config)
}

Entity.prototype.ktPackage = function (config) {
  const packageName = config.package
  if (typeof packageName == 'string') {
    return `package ${packageName}\n\n`
  }
  return ''
}

Entity.prototype.kt_Imports = function (config) {
  const { use, imports } = config
  var result = imports.map(name => `import ${name}`)

  // Delegates use at non-required query to use didSet like code block with Delegates.observable
  result.push('import kotlin.properties.Delegates')
  
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    result.push('import kotlinx.serialization.*')
  }
  if (use.indexOf('kotlin-serialization-json') != -1) {
    result.push('import kotlinx.serialization.json.*')
  }
  return result.joinCode()
}

Entity.prototype.kt_DataClass = function (config) {
  return [
    this.kt_DocComment(config),
    this.kt_Annotation(config),
    '@Suppress("unused")',
    `public data class ${this.name}(`,
      this.kt_Initializer(config),
    ') {',
    this.kt_Writer(config),
    this.kt_InnerType(config),
    this.kt_Endpoints(config),
    '}',
  ].joinCode()
}

Entity.prototype.kt_Annotation = function (config) {
  const { use, serializable } = config

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
  return this.requireWriter ? this.writeOnly().kt_DataClass(config) : null
}

Entity.prototype.kt_InnerType = function (config) {
  return this.subtypes.map(subtype => subtype.kt_DataClass(config))
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
  const { use, serializable } = config

  let annotations = []

  // Use 'kotlin-serialization' and mismatch between kotlin field name and api field name.
  // @see https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/basic-serialization.md#serial-field-names
  if (use.indexOf('kotlin-serialization') != -1 && this.name != this.name.camelize()) {
    annotations.push(`@SerialName("${this.name}")`)
  }

  // Use 'kotlin-serialization'
  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    // Timestamp -> java.time.LocalDateTime, and apply custom serializer.
    if (this.type.referenceName == 'Timestamp') {
      annotations.push(`@Serializable(with = TimestampAsStringSerializer::class)`)
    }
    // URL -> java.net.URL, and apply custom serializer.
    if (this.type.referenceName == 'URL') {
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
    switch (this.type.referenceName) {
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
public data class Writer(
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
    `public class ${this.signature}${this.kt_Initializer()}: ApiEndpoint<${this.signature}.Response> {`,
    `override val path: String = "${this.kt_ParameterizedPath()}"`,
    `override val method: String = "${this.method.toUpperCase()}"`,
    this.kt_QueryData(config),
    this.kt_QueryMembers(config),
    this.kt_FunGetBody(config),
    this.kt_FunDecode(config),
    this.kt_Request(config),
    this.kt_Response(config),
    '}',
  ].joinCode()
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
    .concat(this.query.map(query => query.kt_EndpointClassParameter()))
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
  const { use, serializable } = config

  let annotations = []

  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    // [!] StringFormat is not stable, should set @ExperimentalSerializationApi annotation.
    // @see https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-core/kotlinx.serialization/-string-format/
    if (serializable.format == 'StringFormat') {
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
  const { use, serializable } = config

  let annotations = []

  if (use.indexOf(USE_KOTLIN_SERIALIZATION) != -1) {
    // [!] StringFormat is not stable, thereforeinsert @ExperimentalSerializationApi annotation.
    // @see https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-core/kotlinx.serialization/-string-format/
    if (serializable.format == 'StringFormat') {
      annotations.push('@ExperimentalSerializationApi')
    }
  
    if (this.hasResponse) {
      return `${annotations.joinCode()}\noverride fun decode(formatter: ${this.kt_Formatter(config)}, body: String): Response = formatter.decodeFromString(body)`
    } else {
      return `${annotations.joinCode()}\noverride fun decode(formatter: ${this.kt_Formatter(config)}, body: String): Unit = ()`
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
  if (typeof this.successResponse == 'undefined') {
    return 'public data class Response'
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
  if (this.isRequired) {
    return `var ${this.name.camelize()}: String by Delegates.observable(q) { _, _, new ->\nqueryData["${this.name}"] = new\n}`
  } else {
    return `var ${this.name.camelize()}: String by Delegates.observable(q) { _, _, new ->\nnew?.let { queryData["${this.name}"] = it } ?: queryData.remove("${this.name}")\n}`
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
  return `"${this.name}" to ${this.name.camelize()}`
}

RequestBody.prototype.kt_DataClass = function (config) {
  return `
${this.kt_Annotation(config)}
public data class RequestBody(
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
  return `
${this.kt_Annotation(config)}
public data class Response(
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
  var type = this.referenceName
  if (this.isDefinedType) {
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