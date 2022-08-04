// @ts-check

import Node from './Node.js'
import CommandStep from './CommandStep.js'

export default class RequestStep extends Node {
  /**
   * @type {CommandStep[]}
   */
  receiverSteps

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
}