// @ts-check

import Model from './Node.js'
import RequestBody from './RequestBody.js'
import Response from './Response.js'
import Field from './Field.js'
import Query from './Query.js'
import Parameter from './Parameter.js'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
  HTTP_METHOD_PUT,
  HTTP_METHOD_PATCH,
  HTTP_METHOD_DELETE,
  HTTP_METHOD_HEAD,
} from "../const.js"

import '../extension.js'

export default class Endpoint extends Model {

  /**
   * @type {RequestBody}
   */
  requestBody

  /**
   * @type {Response}
   */
  successResponse

  /**
   * @type {Query[]}
   */
  query

  /**
   * 
   * @param {string} path 
   * @param {string} method 
   * @param {object} schema 
   */
  constructor(path, method, schema = {}) {
    super(`${method} ${path}`, { path, method, ...schema })
    Object.defineProperty(this, 'query', { value: Query.parse(this.schema.query) })
    Object.defineProperty(this, 'requestBody', { value: new RequestBody(schema.request), enumerable: true })
    Object.defineProperty(this, 'successResponse', { value: new Response(schema.success), enumerable: true })

    if (this.requestBody) {
      this.requestBody.moveToParent(this)
    }
    if (this.successResponse) {
      this.successResponse.moveToParent(this)
    }
  }

  /**
   * @returns {string}
   */
  get signature () {
    const summary = this.schema.summary
    if (summary) {
      // @ts-ignore
      return `${summary} Endpoint`.classify()
    } else {
      // @ts-ignore
      return `${this.path.replaceAll('/', ' ').replaceAll(/\$([a-zA-Z_\-]+)/g, '$1').replaceAll(/\{([a-zA-Z_\-]+)\}/g, ' $1')} Endpoint`.classify()
    }
  }

  /**
   * @type {string}
   */
  get path () {
    return this.schema.path
  }

  /**
   * @type {string}
   */
  get method () {
    return this.schema.method.toUpperCase()
  }

  /**
   * @type {boolean}
   */
  get allowBody () {
    return this.method != 'GET'
  }

  /**
   * @returns {Array<Parameter>}
   */
  resolvePathParameters() {

    return this.path
      .split('/')
      .filter(token => /^[\{\$][a-zA-Z_\-]+\}?$/.test(token))
      .map(token => {
        const name = token.replace(/\$([a-zA-Z_\-]+)/g, '$1').replace(/^\{([a-zA-Z_\-]+)\}$/g, '$1')
        const parameter = (this.schema.parameters || {})[name]
        const definition = typeof parameter == 'object' ? parameter.type : name
        if (typeof definition != 'string') {
          throw new Error(`Invalid parameter definition: ${this.method.toUpperCase()} ${this.path} ${token}`)
        }
        const field = this.resolve(definition)
        if (field instanceof Field) {
          return new Parameter(name, field.type.definition, { ...parameter, token })
        } else if (typeof parameter == 'string') {
          return new Parameter(name, parameter, { type: parameter, token })
        } else if (parameter) {
          return new Parameter(name, parameter.type, { ...parameter, token })
        } else {
          return new Parameter(name, 'String', { token })
        }
      })
      .filter(param => param != null)
  }

  /**
   * 
   * @param {string} method 
   * @param {string} path 
   */
  match (method, path) {
    if (this.method != method.toUpperCase()) { return false }
    const actualPath = path.split('/').filter(part => part.length)
    const exceptPath = this.path.split('/').filter(part => part.length)
    const parameters = this.resolvePathParameters()
    if (actualPath.length != exceptPath.length) { return false }
    for (const index in actualPath) {
      const actualElement = actualPath[index]
      const exceptElement = exceptPath[index]
      if (exceptElement[0] == '$') {
        const parameterName = exceptElement.replace(/^\$/, '')
        const parameter = parameters.find(parameter => parameter.name == parameterName)
        if (parameter instanceof Parameter && parameter.match(actualElement) == false) {
          return false
        }
      } else if (actualElement != exceptElement) {
        return false
      }
    }
    return true
  }

  /**
   * 
   * @param {object} override 
   * @returns 
   */
  requestMock (override) {
    if (typeof this.requestBody == 'undefined') {
      return {}
    }
    const mock = this.requestBody.mock()
    if (typeof override == 'object' && typeof mock == 'object') {
      const overrideMock = (obj) => Object.keys(obj).forEach(key => {
        if (typeof override[key] != 'undefined') { obj[key] = override[key] }
        if (typeof obj[key] == 'object' && obj[key] !== null) { overrideMock(obj[key]) }
      })
      overrideMock(mock)
    }
    return mock
  }
}

/*
  ================================
  Utilities
 */

Endpoint.parse = (endpoints) => Object.keys(endpoints || {}).flatMap(path => {
  const { parameters, get, post, put, patch, head } = endpoints[path]
  const del = endpoints[path]['delete'] // `delete` is reserved word.
  var result = []
  if (get)    result.push(new Endpoint(path, HTTP_METHOD_GET,    { parameters, ...get }))
  if (post)   result.push(new Endpoint(path, HTTP_METHOD_POST,   { parameters, ...post }))
  if (put)    result.push(new Endpoint(path, HTTP_METHOD_PUT,    { parameters, ...put }))
  if (patch)  result.push(new Endpoint(path, HTTP_METHOD_PATCH,  { parameters, ...patch }))
  if (del)    result.push(new Endpoint(path, HTTP_METHOD_DELETE, { parameters, ...del }))
  if (head)   result.push(new Endpoint(path, HTTP_METHOD_HEAD,   { parameters, ...head }))
  return result
})