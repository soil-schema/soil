// @ts-check

import Entity from "./Entity.js";
import Model from "./Model.js";

export default class RequestBody extends Model {
  /**
   * @param {object} schema 
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

        const reference = context.resolveReference(definition)
        if (reference instanceof Entity && reference.requireWriter) {
          return { ...schema, name, type: `${reference.name}.Writer` }
        }

        return { ...schema, name, type: definition }
      })
  }
}