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
   * @type {Array<Entity>}
   * @readonly
   */
  subtypes

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

  /**
   * @returns {boolean}
   */
  get immutable () {
    return this.schema.immutable || false
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

  /**
   * @param {string} reference 
   * @returns {any}
   */
  resolveReference (reference) {
    if (reference == this.name) {
      return this
    }

    var tokens = reference.split('.')

    if (tokens.length > 1) {
      // @ts-ignore
      const resolved = this.resolveReference(tokens.shift())
      if (resolved instanceof Entity) {
        return resolved.resolveReference(tokens.join('.'))
      }
      return resolved
    } else {
      const hitField = this.findField(reference)
      if (hitField) {
        return hitField
      }
      const hitSubtype = this.subtypes.find(subtype => subtype.name == reference)
      if (hitSubtype) {
        return hitSubtype
      }
    }
  }
}