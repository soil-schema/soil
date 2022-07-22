// @ts-check

import Model from './Model.js'
import Field from './Field.js'
import Endpoint from './Endpoint.js'
import Writer from './Writer.js'

import '../extension.js'

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

    var subtypes = this.schema.subtypes || []
    this.fields.forEach(field => {
      const subschema = field.schema.schema
      if (typeof subschema == 'undefined') { return }
      // @ts-ignore
      subtypes.push({ name: field.name.classify(), ...subschema })
    })
    Object.defineProperty(this, 'subtypes', { value: subtypes.map(subtype => new Entity(subtype)) })
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
   * @returns {Writer}
   */
  writeOnly () {
    return new Writer(this)
  }
}