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