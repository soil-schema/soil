// @ts-check

import Model from "./Model.js";

export default class Response extends Model {

  /**
   * @param {object} schema 
   */
  constructor(schema) {
    super('Response', schema)
  }

  /**
   * 
   * @param {object} context 
   * @returns 
   */
  resolveParameters(context) {

    if (this.schema.schema === null) { return [] }

    const { entity } = context

    return Object.keys(this.schema.schema)
      .map(name => {
        const definition = this.schema.schema[name]
        if (typeof definition == 'string') {
          return { name, type: definition }
        } else {
          return { ...definition, name }
        }
      })
  }
}