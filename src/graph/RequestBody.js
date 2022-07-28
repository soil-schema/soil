// @ts-check

import Entity from "./Entity.js";
import Model from "./Node.js";

export default class RequestBody extends Model {
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
}