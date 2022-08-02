// @ts-check

import Node from './Node.js'
import Entity from './Entity.js'

export default class RequestBody extends Node {
  /**
   * @param {object|string} schema 
   */
  constructor(schema) {
    super('RequestBody', schema)
  }

  /**
   * @param {object} context 
   * @returns {Array<object>}
   */
  resolveParameters(context) {

    if (typeof this.schema == 'string') { return [] }

    const { entity } = context

    return Object.keys(this.schema.schema)
      .map(name => {
        const schema = this.schema.schema[name]
        const definition = typeof schema == 'string' ? schema : schema.type
        const optional = definition[definition.length - 1] == '?'

        const reference = context.resolveReference(definition.replace(/\?$/, ''))
        if (reference instanceof Entity && reference.requireWriter && !reference.isWritable) {
          return { ...schema, name, type: `${reference.name}.Writer${optional ? '?' : ''}` }
        }

        return { ...schema, name, type: definition }
      })
  }

  mock () {
    if (typeof this.schema == 'undefined') {
      return void 0
    }
    if (typeof this.schema == 'string') {
      // @ts-ignore
      return this.resolve(this.schema).mock()
    }
    return Object.keys(this.schema.schema)
      .reduce((mock, name) => {
        const value = this.resolve(this.schema.schema[name].type)
        if (value instanceof Entity && value.requireWriter) {
          mock[name] = value.writeOnly().mock()
        } else {
          // @ts-ignore
          mock[name] = value.mock()
        }
        return mock
      }, {})
  }
}