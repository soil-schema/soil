import Endpoint from './graph/Endpoint.js'
import Entity from './graph/Entity.js'
import Field from './graph/Field.js'
import Node from './graph/Node.js'
import Parameter from './graph/Parameter.js'
import Response from './graph/Response.js'
import Type from './graph/Type.js'
import Writer from './graph/Writer.js'

const pretty = (code, config) => {
  const lines = code.split('\n')
  const { indent = '    ' } = config.kotlin
  var isImports = true
  var result = []
  var indentLevel = 0
  var annotationBuffer = []
  var commentBuffer = []
  var blockComment = false
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
    const hasBlockSignature = /^(?:((public)\s+)?(override)?(var|val|((data|inner)\s+)?class))\b/.test(line)
    if (hasBlockSignature) {
        result.push('')
        result.push(...commentBuffer)
        result.push(...annotationBuffer)
    }
    if (line.startsWith('.')) {
      indentLevel += 1
    }
    if (line.startsWith('}') || line.startsWith(')')) {
      indentLevel -= 1
    }
    result.push(`${indent.repeat(indentLevel)}${line}`)
    if (line.endsWith('{') || line.endsWith('(')) {
      indentLevel += 1
    }
    if (line.startsWith('.')) {
      indentLevel -= 1
    }
    annotationBuffer = []
    commentBuffer = []
  }
  return result.join('\n')
}

Array.prototype.joinCode = function () {
  return this.filter(item => item != null).join('\n')
}

Array.prototype.joinParameter = function (separator = ', ') {
  return this.filter(item => typeof item == 'string').join(separator)
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
  if (use.indexOf('kotlin-serialization') != -1) {
    result.push('import kotlinx.serialization.*')
  }
  if (use.indexOf('kotlin-serialization-json') != -1) {
    result.push('import kotlinx.serialization.json.*')
  }
  return result.joinCode()
}

Entity.prototype.kt_DataClass = function (config) {
  return `
${this.kt_DocComment(config)}
${this.kt_Annotation(config)}
@Suppress("unused")
public data class ${this.name}(
  ${this.kt_Initializer(config)}
) {
${this.kt_Writer(config)}
${this.kt_Endpoints(config)}
}
`
}

Entity.prototype.kt_Annotation = function (config) {
  const { use } = config

  // Use 'kotlin-serialization'
  if (use.indexOf('kotlin-serialization') != -1) {
    return '@Serializable'
  }

  // No field annotation
  return ''
}

Entity.prototype.kt_Initializer = function (config) {
  return this.fields.map(field => field.kt_DataClassParameter(config)).joinParameter(',\n')
}

Entity.prototype.kt_Writer = function (config) {
  if (this.requireWriter == false) {
    return null
  }

  return this.writeOnly().kt_DataClass(config)
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

  // Use 'kotlin-serialization-json' and mismatch kotlin field name and api field name.
  if (use.indexOf('kotlin-serialization-json') != -1 && this.name != this.name.camelize()) {
    return `@JsonNames("${this.name}")\n`
  }

  // No field annotation
  return ''
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
  if (use.indexOf('kotlin-serialization') != -1) {
    result.push('@Serializable')
  }

  // No field annotation
  return result.joinCode()
}

Writer.prototype.kt_InitializerParameters = function (config) {
  return this.fields.map(field => field.kt_DataClassParameter(config)).joinParameter(',\n')
}

Endpoint.prototype.kt_Definition = function (config) {
  return `
public class ${this.signature}${this.kt_Initializer()}: ApiEndpoint<${this.signature}.Response> {
  override val path: String = "${this.path}"${this.kt_pathReplacer()}
  override val method: String = "${this.method.toUpperCase()}"
${this.kt_FunDecode(config)}
${this.kt_Response(config)}
}`
}

Endpoint.prototype.kt_Initializer = function (config) {
  if (this.pathParameters.length == 0) {
    return ''
  } else {
    return `(${this.kt_InitializerParameters(config)})`
  }
}

Endpoint.prototype.kt_InitializerParameters = function () {
  return this.pathParameters.map(parameter => parameter.kt_EndpointClassParameter()).joinParameter(',\n')
}

Endpoint.prototype.kt_pathReplacer = function () {
  if (this.pathParameters.length > 0) {
    return '\n' + this.pathParameters.map(parameter => `.replace("\\$${parameter.name}", ${parameter.name})`).join('\n')
  } else {
    return ''
  }
}

Endpoint.prototype.kt_FunDecode = function (config) {
  const { use } = config
  if (use.indexOf('kotlin-serialization-json') != -1) {
    return `override fun decode(formatter: Json, json: String): Response = formatter.decodeFromString(json)`
  }
  return '// No decode method.'
}

Endpoint.prototype.kt_Response = function (config) {
  if (typeof this.successResponse == 'undefined') {
    return 'public data class Response'
  } else {
    return this.successResponse.kt_DataClass(config)
  }
}

Parameter.prototype.kt_EndpointClassParameter = function () {
  return `val ${this.name}: ${this.type.kt_TypeArgument()}`
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

  if (annotations.writer) {
    result.push(annotations.response)
  }

  // Use 'kotlin-serialization'
  if (use.indexOf('kotlin-serialization') != -1) {
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
      case 'String':
        type = 'String'
        break
      case 'Integer':
        type = 'Int'
        break
      case 'Number':
        type = 'Double'
        break
      case 'Boolean':
        type = 'Boolean'
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