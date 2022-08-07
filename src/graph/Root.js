import Node from './Node.js'

import Entity from './Entity.js'
import Scenario from './Scenario.js'
import Endpoint from './Endpoint.js'

export default class Root extends Node {
  
  constructor (config = {}) {
    super('Root', {})
    Object.defineProperty(this, 'config', { value: config })
  }

  get entities () {
    return this.root.children.filter(child => child instanceof Entity)
  }

  /**
   * @returns {Endpoint[]}
   */
  get endpoints () {
    return this.entities.flatMap(entity => entity.endpoints)
  }

  get scenarios () {
    return this.root.children.filter(child => child instanceof Scenario)
  }

  /**
   * 
   * @param {string} method 
   * @param {string} path 
   * @returns {Endpoint|undefined}
   */
  findEndpoint (method, path) {
    return this.endpoints.find(endpoint => endpoint.match(method, path))
  }

  /**
   * @param {string} referenceBody 
   * @param {boolean} allowGlobalFinding 
   * @returns {Node|undefined}
   */
  resolve (referenceBody, allowGlobalFinding = false) {
    const [method] = referenceBody.split(' ')
    if (/^(GET|POST|PUT|PATCH|DELETE|HEAD)\s+/.test(method)) {
      return this
        .entities
        .flatMap(entity => entity.endpoints)
        .find(endpoint => {
          return `${endpoint.method} ${endpoint.path}` == referenceBody
        })
    } else {
      return super.resolve(referenceBody, allowGlobalFinding)
    }
  }
}