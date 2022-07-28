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
  constructor(path, method, schema) {
    super(path, { path, method, ...schema })
    Object.defineProperty(this, 'query', { value: Query.parse(this.schema.query) })
    Object.defineProperty(this, 'requestBody', { value: new RequestBody(schema.request), enumerable: true })
    Object.defineProperty(this, 'successResponse', { value: new Response(schema.success), enumerable: true })
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
   * 
   * @param {object} context 
   * @returns {Array<Parameter>}
   */
  resolvePathParameters(context = {}) {

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
        const field = context.resolveReference(definition)
        if (field) {
          return new Parameter(name, field.type.definition, { ...parameter, token })
        } else if (parameter) {
          return new Parameter(name, parameter.type, { ...parameter, token })
        } else {
          return new Parameter(name, 'String', { token })
        }
      })
      .filter(param => param != null)
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