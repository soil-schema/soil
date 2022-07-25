// @ts-check

import Model from './Model.js'
import RequestBody from './RequestBody.js'
import Response from './Response.js'
import Field from './Field.js'
import {
  HTTP_METHOD_GET,
  HTTP_METHOD_POST,
  HTTP_METHOD_PUT,
  HTTP_METHOD_PATCH,
  HTTP_METHOD_DELETE,
  HTTP_METHOD_HEAD,
} from "../const.js"

import '../extension.js'
import Query from './Query.js'

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
  get summary () {
    return `${super.summary} Endpoint`
  }

  /**
   * @returns {string}
   */
  get signature () {
    // @ts-ignore
    return `${this.schema.summary} Endpoint`.classify()
  }

  /**
   * @returns {string}
   */
  get path () {
    return this.schema.path
  }

  /**
   * @returns {string}
   */
  get method () {
    return this.schema.method.toUpperCase()
  }

  /**
   * @returns {boolean}
   */
  get allowBody () {
    return this.method != 'GET'
  }

  /**
   * 
   * @param {object} context 
   * @returns {Array<Field>}
   */
  resolvePathParameters(context) {

    const { entity } = context

    return this.path
      .split('/')
      .filter(token => /^\{[a-zA-Z_\-]+\}$/.test(token))
      .map(token => {
        const name = token.substring(1, token.length - 1)
        const parameter = (this.schema.parameters || {})[name]
        const definition = typeof parameter == 'object' ? parameter.ref : name
        const field = context.resolveReference(definition)
        if (field) {
          return field.replace(name, parameter || {})
        } else {
          return null
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