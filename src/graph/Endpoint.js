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
   * 
   * @param {object} schema 
   */
  constructor(schema = {}) {
    const { method, path } = schema
    super(schema.name || `${method} ${path}`, { path, method, ...schema })

    this.schema.query?.forEach(query => {
      this.addChild(new Query(query.name, query))
    })

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
   * @type {Query[]}
   */
  get query () {
    // @ts-ignore
    return this.findAny(child => child instanceof Query)
  }

  /**
   * @type {boolean}
   */
  get hasQuery () {
    return this.query.length > 0
  }

  /**
   * @type {boolean}
   */
  get allowBody () {
    return this.method != 'GET' && this.hasRequestBody
  }

  /**
   * @type {boolean}
   */
  get hasRequestBody () {
    return this.requestBody.fields.length > 0
  }

  /**
   * @type {boolean}
   */
  get hasResponse () {
    return typeof this.successResponse.schema != 'undefined'
  }

  /**
   * @returns {object[]}
   */
  captureSubschemas () {
    const subschemas = []
    this.requestBody.fields.forEach(field => {
      field.captureSubschemas()
        .forEach(schema => subschemas.push(schema))
    })
    this.successResponse.fields.forEach(field => {
      field.captureSubschemas()
        .forEach(schema => subschemas.push(schema))
    })
    return subschemas
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

  get pathParameters () {
    return this.resolvePathParameters()
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
    const parameters = this.pathParameters
    if (actualPath.length != exceptPath.length) { return false }
    for (const index in actualPath) {
      const actualElement = actualPath[index]
      const exceptElement = exceptPath[index]
      if (exceptElement[0] == '$' && actualElement[0] == '$') {
        // Skip false check.
      } else if (exceptElement[0] == '$') {
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

  /**
   * 
   * @param {(name: string) => any} queryProvider 
   * @returns {string}
   */
  buildQueryString (queryProvider) {
    const { booleanQuery } = this.config.api

    const query = this.query.reduce((/** @type {string[]} */ result, query) => {

      var value = queryProvider(query.name)

      if (typeof value == 'undefined') return result

      if (query.type.referenceName == 'Boolean') {
        // Apply config.api.booleanQuery strategy
        if (value == 'false' && ['set-only-ture', 'only-key'].includes(booleanQuery)) return result
        switch (booleanQuery) {	
          // true sets query value 1, false sets query value 0.
          case 'numeric':
            value = value == 'true' ? "1" : "0"
            break
          // Boolean value convert to string like "true" or "false".
          case 'stringify':
            /* Nothing to do */
            break
          // true sets query value 1, but false remove key from query string. (add removing helper)
          case 'set-only-true':
            value = '1'
            break
          // true sets key but no-value likes `?key`. false remove key from query string. (add removing helper)
          case 'only-key':
            return [ ...result, query.name ]
        }
      }

      return [ ...result, `${query.name}=${encodeURIComponent(value)}` ]
    }, [])

    return query.length > 0 ? `?${query.join('&')}` : ''
  }

  // For Reporting

  /**
   * @returns {string}
   */
  get reportSignature () {
    var signature = `${this.method} ${this.path}`
    if (this.schema.name) {
      signature += ` - ${this.entityPath}`
    }
    return signature
  }
}
