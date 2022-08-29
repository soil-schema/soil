import Node from './Node.js'
import CommandStep from './CommandStep.js'
import RequestStep from './RequestStep.js'

export default class Scenario extends Node {
  /**
   * @type {(CommandStep|RequestStep)[]}
   */
  steps

  /**
   * @param {object} schema 
   */
  constructor (schema) {
    super(schema.name, schema)

    const steps = schema.steps
      ?.map(step => {
        if (step.command) {
          return new CommandStep(step.command, step.args)
        }
        if (step.request) {
          return new RequestStep(step.request, step)
        }
      })
    Object.defineProperty(this, 'steps', { value: steps || [] })

    this.steps
      .filter(step => step instanceof Node)
      .forEach(step => step.moveToParent(this))
  }

  /**
   * @type {boolean}
   */
  get isShared () {
    return this.schema.annotation == 'shared'
  }
}