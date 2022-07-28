// @ts-check

import Node from './Node.js'
import Field from './Field.js'
import Endpoint from './Endpoint.js'
import Writer from './Writer.js'

import '../extension.js'

export default class Entity extends Node {

  /**
   * @type {boolean}
   * @private
   */
  _inReference = false

  /**
   * @param {object} schema 
   */
  constructor(schema) {
    if (typeof schema.name != 'string') {
      throw new Error(`Invalid entity name`)
    }
    super(schema.name, schema)

    Object.keys(this.schema.fields || {}).forEach(name => {
      this.addChild(name, new Field(name, this.schema.fields[name]))
    })

    Object.defineProperty(this, 'endpoints', { value: Endpoint.parse(this.schema.endpoints) })

    this.fields.forEach(field => {
      field.captureSubschemas()
        // @ts-ignore
        .map(subschema => new Entity(subschema))
        .forEach(entity => this.addChild(entity.name, entity))
    })
    if (this.schema.subtypes) {
      this.schema.subtypes.forEach((/** @type {object} */ subschema) => {
        // @ts-ignore
        this.addChild(subschema.name, new Entity(subschema))
      })
    }
  }

  /**
   * @returns {boolean}
   */
  get immutable () {
    return this.schema.immutable || false
  }

  get readableFields () {
    return this.fields.filter(field => !field.writer)
  }

  /**
   * @type {Field[]}
   */
   get fields () {
    // @ts-ignore
    return this.findAny(node => node instanceof Field)
  }

  /**
   * @type {Entity[]}
   */
   get subtypes () {
    // @ts-ignore
    return this.findAny(node => node instanceof Entity)
  }

  /**
   * @param {string} name 
   * @returns {Field?}
   */
  findField (name) {
    return this.fields.find(field => field.name == name) || null
  }

  /**
   * @param {string} name 
   * @returns {Entity?}
   */
  findSubtype (name) {
    return this.subtypes.find(subtype => subtype.name == name) || null
  }

  /**
   * @type {boolean}
   */
  get requireWriter () {
    try {
      for (var field of this.fields) {
        if (field.mutable || field.writer) return true
      }
      for (var field of this.fields) {
        const resolved = this.resolve(field.type.referenceName)
        this._inReference = true
        if (resolved instanceof Entity) {
          if (resolved._inReference == false && resolved.requireWriter) return true
        }
      }
    } finally {
      this._inReference = false
    }
    return false
  }

  /**
   * @type {boolean}
   */
  get isWritable () {
    try {
      for (var field of this.fields) {
        if (!field.mutable) return false
      }
      for (var field of this.fields) {
        const resolved = this.resolve(field.type.referenceName)
        this._inReference = true
        if (resolved instanceof Entity) {
          if (resolved._inReference == false && resolved.isWritable == false) return false
        }
      }
    } finally {
      this._inReference = false
    }
    return true
  }

  /**
   * @returns {Writer}
   */
  writeOnly () {
    return new Writer(this)
  }
}