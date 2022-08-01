// @ts-check

import Node from './Node.js'
import Root from './Root.js'
import Runner from '../runner/Runner.js'
import Endpoint from './Endpoint.js'

export default class RequestStep extends Node {
  /**
   * @param {object} request 
   * @param {object} schema 
   */
  constructor (request, schema) {
    if (request.reference) {
      super(request.reference, schema)
    } else {
      super(`${request.method} ${request.path}`, schema)
    }
  }

  /**
   * @param {Runner} env 
   * @param {Root} root
   */
  execute (env, root) {
    env.log('Request Step', this.name)

    const endpoint = root.resolve(this.name) || root.endpoints.find(endpoint => endpoint.name == this.name)
    if (endpoint instanceof Endpoint) {
      env.request(endpoint.method, endpoint.path, endpoint.requestBody.mock())
    } else {
      console.error('Endpoint Not Found', this.name)
    }
  }
}