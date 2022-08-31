import Node from './Node.js'

import Entity from './Entity.js'
import Scenario from './Scenario.js'
import Endpoint from './Endpoint.js'

export default class Root extends Node {
  
  constructor (config = {}) {
    super('Root', {})
    Object.defineProperty(this, 'config', { value: config })

    // Allow mocking for tests
    this.__Node_resolve = super.resolve.bind(this)
  }

  get entities () {
    return this.findAny(child => child instanceof Entity)
  }

  /**
   * @returns {Endpoint[]}
   */
  get endpoints () {
    return this.entities.flatMap(entity => entity.endpoints)
  }

  get scenarios () {
    return this.findAny(child => child instanceof Scenario)
  }

  get entityPath () {
    return undefined
  }

  /**
   * 
   * @param {string} method 
   * @param {string} path 
   * @returns {Endpoint|undefined}
   */
  findEndpoint (method, path) {
    var hit = undefined
    var hitScore = 0
    this.endpoints.forEach(endpoint => {
      const score = endpoint.score(method, path)
      if (score > hitScore) {
        hit = endpoint
        hitScore = score
      }
    })
    return hit
  }

  /**
   * 
   * @param {string} name
   * @returns {Scenario|undefined}
   */
  findScenario (name) {
    return this.scenarios.find(scenario => scenario.name == name)
  }

  /**
   * Resolve reference path or endpoint definition string.
   * 
   * If `referenceBody` is reference path with dot notation,
   * delegate this method to `Node.resolve` method.
   * 
   * If `referenceBody` formats `<http-method> <http-path>` string,
   * find the endpoint match http-method and http-math with scoring logic.
   * See more info: {@link Root.findEndpoint}
   * 
   * @param {string} referenceBody 
   * @param {boolean} allowGlobalFinding 
   * @returns {Node|undefined}
   */
  resolve (referenceBody, allowGlobalFinding = false) {
    const [method, path] = referenceBody.split(' ')
    if (/^(GET|POST|PUT|PATCH|DELETE|HEAD)$/.test(method)) {
      return this.findEndpoint(method, path)
    } else {
      return this.__Node_resolve(referenceBody, allowGlobalFinding)
    }
  }
}