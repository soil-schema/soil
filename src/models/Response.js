// @ts-check

import Model from "./Model.js";

export default class Response extends Model {

  /**
   * @param {object} schema 
   */
  constructor(schema) {
    super('Response', schema)
  }

  resolveParameters(context) {

    if (this.schema.schema === null) { return [] }

    const { entity } = context

    return Object.keys(this.schema.schema)
      .map(name => {
        const definition = this.schema.schema[name]
        return { name, type: definition }
      })
  }
}