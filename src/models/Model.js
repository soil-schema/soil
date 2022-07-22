// @ts-check

export default class Model {

  /**
   * @type {string}
   * @readonly
   */
  name

  /**
   * @type {object}
   */
  schema

  /**
   * @param {string} name 
   * @param {object} schema 
   */
  constructor(name, schema) {
    Object.defineProperty(this, 'name', { value: name, enumerable: true })
    Object.defineProperty(this, 'schema', { value: Object.freeze(schema) })
  }

  get summary () {
    return this.schema.summary
  }

  get description () {
    const { description } = this.schema
    if (typeof description == 'string') {
      return description.trim()
    }
    return null
  }

  /**
   * @param {string} newName 
   * @param {object} schema 
   */
  replace (newName, schema = {}) {
    // @ts-ignore
    return new this.constructor(newName, Object.assign({}, this.schema, schema))
  }
}