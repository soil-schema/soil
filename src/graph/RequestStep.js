// @ts-check

import Node from './Node.js'
import CommandStep from './CommandStep.js'
import ScenarioRuntimeError from '../errors/ScenarioRuntimeError.js'
import Endpoint from './Endpoint.js'

export default class RequestStep extends Node {
  /**
   * @type {CommandStep[]}
   */
  receiverSteps

  /**
   * @type {string|undefined}
   * @readonly
   */
  reference

  /**
   * @type {string}
   * @readonly
   */
  method

  /**
   * @type {string}
   * @readonly
   */
  path

  /**
   * @type {{ [key: string]: string }}}
   * @readonly
   */
  overrides

  /**
   * @param {object} request 
   * @param {object} schema 
   */
  constructor (request, schema) {
    if (request.reference) {
      super(request.reference, schema)
      Object.defineProperty(this, 'reference', { value: request.reference })
    } else {
      super(`${request.method} ${request.path}`, schema)
      Object.defineProperty(this, 'method', { value: request.method })
      Object.defineProperty(this, 'path', { value: request.path })
    }

    Object.defineProperty(this, 'overrides', { value: schema.overrides })

    const receiver = schema.receiver
    if (receiver) {
      const steps = (receiver.steps || [])
        .map(step => {
          if (step.command) {
            return new CommandStep(step.command, step.args)
          }
          if (step.request) {
            throw new Error('Invalid request step (can\'t run request step in receiver block)')
          }
        })
      Object.defineProperty(this, 'receiverSteps', { value: steps, enumerable: false })
    } else {
      Object.defineProperty(this, 'receiverSteps', { value: [], enumerable: false })
    }
  }

  get commandName () {
    return 'request'
  }

  get args () {
    return [this]
  }

  /**
   * Find an referenced endpoint and load method and path from it for preparing.
   * @returns 
   */
  prepare () {
    if (typeof this.reference == 'undefined') return
    const endpoint = this.resolve(this.reference)
    if (typeof endpoint == 'undefined') throw new ScenarioRuntimeError(`Referenced endpoint is not found \`${this.reference}\``)
    if (endpoint instanceof Endpoint) {
      Object.defineProperty(this, 'method', { value: endpoint.method })
      Object.defineProperty(this, 'path', { value: endpoint.path })
    } else {
      throw new ScenarioRuntimeError(`Referenced node \`${this.reference}\` is not Endpoint.`)
    }
  }

  /**
   * @type {Endpoint|undefined}
   */
  get endpoint () {
    return this.root.findEndpoint(this.method, this.path)
  }

  mock () {
    return this.endpoint?.requestBody?.mock()
  }
}