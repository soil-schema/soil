// @ts-check

import Model from './Model.js'
import Field from './Field.js'
import Endpoint from './Endpoint.js'
import WriteOnlyEntity from './WriteOnlyEntity.js'

export default class Entity extends Model {

  /**
   * @type {Array<Field>}
   * @readonly
   */
  fields

  /**
   * @param {object} schema 
   */
  constructor(schema) {
    super(schema.name, schema)

    Object.defineProperty(this, 'fields', { value: Field.parse(this.schema.fields) })
    Object.defineProperty(this, 'endpoints', { value: Endpoint.parse(this.schema.endpoints) })
  }

  get readableFields () {
    return this.fields.filter(field => !field.hasAnnotation('WriteOnly'))
  }

  /**
   * @param {string} name 
   * @returns {Field?}
   */
  findField (name) {
    return this.fields.find(field => field.name == name) || null
  }

  /**
   * @returns {boolean}
   */
  get requireWritable () {
    return this.fields
      .filter(field => field.hasAnnotation('ReadOnly') || field.hasAnnotation('WriteOnly'))
      .length > 0
  }

  /**
   * @returns {WriteOnlyEntity}
   */
  writeOnly () {
    return new WriteOnlyEntity(this)
  }
}