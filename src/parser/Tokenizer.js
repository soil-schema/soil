// @ts-check

import url from 'node:url'

import SyntaxError from '../errors/SyntaxError.js'
import Token from './Token.js'

/**
 * 
 * @param {string} body
 * @returns {number[]}
 */
 export const makeLineMap = function (body) {
  return body.split('\n').reduce((/** @type {number[]} */ result, line) => [ ...result, line.length + 1 ], [])
}

/**
 * 
 * @param {number} offset 
 * @param {number[]} lineMap 
 * @returns {{ line: number, column: number }}
 */
export const offsetToPosition = function (offset, lineMap) {
  for (const [lineOffset, size] of lineMap.entries()) {
    if (offset + 1 <= size) {
      return { line: lineOffset + 1, column: offset + 1 }
    }
    offset -= size
  }
  return { line: 0, column: 0 }
}

const COMMENT_PATTERN = /^(\- [^\n]+)(\n|$)/
const DESCRIPTION_PATTERN = /^(# [^\n]+|#)(\n|$)/
const TYPE_DEFINITION_PATTERN = /^:\s+(?<type>(?:List\<(?:[\w\.]+|\*)\>|[\w\.]+|\*)\??)/
const ENTITY_PATTERN = /^entity\s+([A-Z][a-zA-Z0-9]+)\b/
const FIELD_PATTERN = /^(?:(?<annotation>mutable|writer)\s+)?field\s+(?<name>[a-z][\w]*)\b/
const PARAMETER_PATTERN = /^parameter\s+(?<name>[a-z][\w]*)\b/
const QUERY_PATTERN = /^(?:(?<annotation>required)\s+)?query\s+(?<name>[a-z][\w]*)\b/
const INNER_TYPE_PATTERN = /^inner\s+(?<name>[A-Z][a-zA-Z0-9]+)\b/
const ENDPOINT_PATTERN = /^endpoint\s+(?<method>GET|POST|PUT|PATCH|DELETE|HEAD)\s+(?<path>(?:\/\$?(?:[^\s]+))+)/
const PROPERTY_PATTERN = /^(?<name>name|default|depend-on)\s+(?<value>.+)(\n|\-\s|#\s|$)/
const SCENARIO_PATTERN = /^(?:(?<annotation>shared)\s+)?scenario\s+(?<name>[\w\s]+\w)\s+/
const DIRECTIVE_PATTERN = /^(entity|field|schema|inner|endpoint|query|parameter|request|success|scenario|setup|receive|default|name|example|enum)\b/
const REQUEST_HTTP_SHORTHAND_PATTERN = /^(?<method>GET|POST|PUT|PATCH|DELETE|HEAD)\s+(?<path>(?:\/\$?(?:[^\s]+))+)/
const REQUEST_REFERENCE_SHORTHAND_PATTERN = /^(?<entity>[A-Z][a-zA-Z0-9]+)\.(?<endpoint_name>\w+)/
const ASSIGNMENT_PATTERN = /^(?<name>\w+)[\t ]*=[\t ]*(?<body>[^\r\n]+)(\n|$)/
const COMMAND_BEGIN_PATTERN = /^(?<command>@[a-z][a-z\-]+[a-z])\b(?<parameter_body>[^\n\{\}]*)/
const ARRAY_PATTERN = /^\[(?<items>(?:\\\[|[^\[])*)\]/
const VALUE_PATTERN = /^(?<value>"(?:\\"|[^"])*"|\-?\d+|true|false|null)[\s$]/
const VARIABLE_PATTERN = /^(?<name>\$[a-z0-9\_\.]+)\b/

/**
 * @memberof Parser
 * @param {string} body 
 * @returns {Token[]}
 */
export const tokenize = function (body) {
  var offset = 0
  /**
   * @type {Token[]}
   */
  var tokens = []
  var skippedBuffer = ''
  var skip = false

  const lineMap = makeLineMap(body)
  const pushToken = (/** @type{string|undefined} */ value, /** @type{string} */ semantic) => {

    // Skipped buffer push to tokens as Unquoted string.
    if (skippedBuffer.length > 0 && /^\s+$/.test(skippedBuffer) == false) {
      const token = new Token({
        uri: this.uri,
        offset,
        ...offsetToPosition(offset - skippedBuffer.trimStart().length, lineMap),
        value: skippedBuffer.trim(),
        semantic: 'string.unquoted'
      })
      tokens.push(token)
    }

    // Clear skipped buffer
    skippedBuffer = ''

    // Ignore undefined value (assertion)
    if (typeof value == 'undefined') throw new Error('Tokenizer Error')

    // Find offset of the target value
    while (body.substring(offset).startsWith(value) == false) offset += 1

    // Build and push the token
    const token = new Token({ uri: this.uri, offset, ...offsetToPosition(offset, lineMap), value: value.trimEnd(), semantic })
    tokens.push(token)

    // Add offset
    offset += token.value.length
  }

  const test = (/** @type {RegExp|string} */ pattern, /** @type {(result: RegExpMatchArray) => void} */ callback) => {
    if (skip) return
    const result = body.substring(offset).match(pattern)
    if (result === null) return
    callback(result)
    skip = true
  }

  while (offset < body.length) {

    skip = false

    test(COMMENT_PATTERN, (match) => {
      pushToken(match[1], 'comment.line')
    })

    test(DESCRIPTION_PATTERN, (match) => {
      pushToken(match[1], 'comment.line.description')
    })

    test(TYPE_DEFINITION_PATTERN, (match) => {
      pushToken(':', 'keyword.operator.definition.type')
      pushToken(match.groups?.type, 'type')
    })

    test(ENTITY_PATTERN, (match) => {
      pushToken('entity', 'keyword.directive.entity')
      pushToken(match[1], 'entity.name.entity')
    })

    test(FIELD_PATTERN, (match) => {
      if (match.groups?.annotation) {
        pushToken(match.groups.annotation, `keyword.annotation.${match.groups.annotation}.field`)
      }
      pushToken('field', 'keyword.directive.field')
      pushToken(match.groups?.name, 'entity.name.field')
    })

    test(PARAMETER_PATTERN, (match) => {
      pushToken('parameter', 'keyword.directive.parameter')
      pushToken(match.groups?.name, 'entity.name.parameter')
    })

    test(QUERY_PATTERN, (match) => {
      if (match.groups?.annotation) {
        pushToken(match.groups.annotation, `keyword.annotation.${match.groups.annotation}.query`)
      }
      pushToken('query', 'keyword.directive.query')
      pushToken(match.groups?.name, 'entity.name.query')
    })

    test(INNER_TYPE_PATTERN, (match) => {
      pushToken('inner', 'keyword.directive.inner')
      pushToken(match.groups?.name, 'entity.name.inner')
    })

    test(ENDPOINT_PATTERN, (match) => {
      pushToken('endpoint', 'keyword.directive.endpoint')
      pushToken(match.groups?.method, 'keyword.other.http-method.endpoint')
      pushToken(match.groups?.path, 'string.http-path.endpoint')
    })

    test(SCENARIO_PATTERN, (match) => {
      if (match.groups?.annotation) {
        pushToken(match.groups.annotation, `keyword.annotation.${match.groups.annotation}.scenario`)
      }
      pushToken('scenario', 'keyword.directive.scenario')
      pushToken(match.groups?.name, 'entity.name.scenario')
    })

    test(COMMAND_BEGIN_PATTERN, (match) => {
      pushToken(match.groups?.command, `function.command`)
      var parameterBody = match.groups?.parameter_body
      if (parameterBody) {
        const isParenthesis = /^\(.*\)$/.test(parameterBody)
        if (isParenthesis) {
          pushToken('(', 'punctuation.parameters.open.command')
          parameterBody = parameterBody.substring(1, parameterBody.length - 1)
        }
        while (parameterBody.length) {
          const value = parameterBody.match(VALUE_PATTERN)?.groups?.value
          if (value) {
            pushToken(value, `${makeValueSemantic(value)}.parameter.command`)
            parameterBody = parameterBody.substring(value.length)
            if (parameterBody[0] == ',') {
              parameterBody = parameterBody.substring(1)
            }
            continue
          }
          const parameter = parameterBody.match(/^(?<value>[^,\r\n ][^,\r\n]+)/)?.groups?.value
          if (parameter) {
            pushToken(parameter, 'string.unquote.parameter.command')
            parameterBody = parameterBody.substring(parameter.length)
            if (parameterBody[0] == ',') {
              parameterBody = parameterBody.substring(1)
            }
            continue
          }
          parameterBody = parameterBody.substring(1)
        }
        if (isParenthesis) {
          pushToken(')', 'punctuation.parameters.close.command')
        }
      }
    })

    test(ARRAY_PATTERN, (match) => {
      pushToken('[', `punctuation.array.open`)
      var items = match.groups?.items
      if (items) {
        while (items.length) {
          const value = items.match(VALUE_PATTERN)?.groups?.value
          if (value) {
            pushToken(value, `${makeValueSemantic(value)}.parameter.command`)
            items = items.substring(value.length)
            if (items[0] == ',') {
              items = items.substring(1)
            }
            continue
          }
          const parameter = items.match(/^(?<value>[^,\r\n ][^,\r\n]+)/)?.groups?.value
          if (parameter) {
            pushToken(parameter, 'string.unquote.parameter.command')
            items = items.substring(parameter.length)
            if (items[0] == ',') {
              items = items.substring(1)
            }
            continue
          }
          items = items.substring(1)
        }
      }
      pushToken(']', `punctuation.array.close`)
    })

    test(VARIABLE_PATTERN, (match) => {
      pushToken(match.groups?.name, `variable.reference`)
    })

    test(REQUEST_HTTP_SHORTHAND_PATTERN, (match) => {
      pushToken(match.groups?.method, 'keyword.other.http-method')
      pushToken(match.groups?.path, 'string.http-path')
    })

    test(REQUEST_REFERENCE_SHORTHAND_PATTERN, (match) => {
      pushToken(match[0], 'entity.reference.request')
    })

    test(ASSIGNMENT_PATTERN, (match) => {
      pushToken(match.groups?.name, 'entity.name.variable.assignment')
      pushToken('=', 'keyword.operator.assignment')
      pushToken(match.groups?.body, 'parameter.assignment')
    })

    test(PROPERTY_PATTERN, (match) => {
      pushToken(match.groups?.name, `keyword.property.${match.groups?.name}`)
      pushToken(match.groups?.value, `string.property.${match.groups?.name}`)
    })

    test(DIRECTIVE_PATTERN, (match) => {
      pushToken(match[0], `keyword.directive.${match[0]}`)
    })

    test(VALUE_PATTERN, (match) => {
      // @ts-ignore
      const { value } = match.groups
      pushToken(value, makeValueSemantic(value))
    })

    test(/^\{/, () => {
      pushToken('{', 'punctuation.block.open')
    })

    test(/^\}/, () => {
      pushToken('}', 'punctuation.block.close')
    })

    if (skip == false) {
      skippedBuffer += body[offset]
      offset += 1
    }
  }

  return tokens

}

/**
 * 
 * @param {string} value 
 * @returns 
 */
const makeValueSemantic = function (value) {
  if (['true', 'false'].includes(value)) {
    return 'constant.language.boolean.${value}'
  }
  if (value == 'null') {
    return 'constant.language.${value}'
  }
  if (/^\d+$/.test(value)) {
    return 'number'
  }
  return 'string.quoted.double'
}

export default class Tokenizer {
  /**
   * @type {object}
   */
  rootObject

  /**
   * @param {string} filepath 
   * @param {string} body 
   */
  constructor (filepath, body) {
    this.filepath = filepath
    this.body = body
  }

  /**
   * @type {string}
   */
  get uri () {
    return url.pathToFileURL(this.filepath).toString()
  }

  tokenize () {
    // Apply first function to last function
    this.rootObject = [tokenize]
      .reduce((payload, func) => func.call(this, payload), this.body)
    return this.rootObject
  }
}