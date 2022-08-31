// @ts-check

import Model from './Node.js'
import RequestBody from './RequestBody.js'
import Response from './Response.js'
import Field from './Field.js'
import Query from './Query.js'
import Parameter from './Parameter.js'

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
    this.schema.parameters?.forEach(parameter => {
      this.addChild(new Parameter(parameter))
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
    const name = this.schema.name
      ?.replaceAll(/[A-Z]/g, match => ` ${match[0]}`)
    if (name) {
      // @ts-ignore
      return `${name} Endpoint`.classify()
    }
    const summary = this.schema.summary
    if (summary) {
      // @ts-ignore
      return `${summary} Endpoint`.classify()
    }
    // @ts-ignore
    return `${this.path.replaceAll('/', ' ').replaceAll(/\$([a-zA-Z_\-]+)/g, '$1').replaceAll(/\{([a-zA-Z_\-]+)\}/g, ' $1')} Endpoint`.classify()
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
   * @type {boolean}
   */
  get ignoreCoverage () {
    return !!this.schema['ignore-coverage']
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
   * 
   * @param {string} name 
   * @returns {Parameter|undefined}
   */
  findParameter (name) {
    // @ts-ignore
    return this
      .findAny(child => child instanceof Parameter)
      .find(parameter => parameter.name == name)
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
        const parameter = this.findParameter(name)
        const { definition } = parameter || {}
        const field = this.resolve(definition || name)
        if (field instanceof Field) {
          return new Parameter({ ...parameter?.schema, token, name, type: field.type.definition })
        } else if (parameter) {
          return new Parameter({ ...parameter.schema, name, token })
        }
        return new Parameter({ name, type: 'String', token })
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
  score (method, path) {
    if (this.method != method.toUpperCase()) { return 0 }
    const actualPath = path.split('/').filter(part => part.length)
    const exceptPath = this.path.split('/').filter(part => part.length)
    const parameters = this.pathParameters
    if (actualPath.length != exceptPath.length) { return 0 }

    var score = 0

    for (const index in actualPath) {
      const actualElement = actualPath[index]
      const exceptElement = exceptPath[index]
      if (exceptElement[0] == '$' && actualElement[0] == '$') {
        score += 2
        continue
      }
      if (exceptElement[0] == '$') {
        const parameterName = exceptElement.replace(/^\$/, '')
        const parameter = parameters.find(parameter => parameter.name == parameterName)
        if (parameter instanceof Parameter && parameter.match(actualElement) == false) {
          return 0
        }
        score += 1
        continue
      }
      if (actualElement[0] == '$') {
        score += 1
        continue
      }
      if (actualElement != exceptElement) {
        return 0
      }
      score += 3
    }
    return score
  }

  /**
   * 
   * @param {(name: string) => any} queryProvider 
   * @returns {string}
   */
  buildQueryString (queryProvider) {

    const query = this.query.reduce((/** @type {string[]} */ result, query) => {

      var value = queryProvider(query.name)?.toString()

      if (typeof value == 'undefined') return result

      if (query.type.definitionBody == 'Boolean') {
        const { booleanQuery } = this.config.api
        // Apply config.api.booleanQuery strategy
        if (value == 'false' && ['set-only-true', 'only-key'].includes(booleanQuery)) return result
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
