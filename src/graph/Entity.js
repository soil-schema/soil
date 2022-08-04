// @ts-check

import Node from './Node.js'
import Root from './Root.js'
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
   * @type {Endpoint[]}
   */
  endpoints

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

    this.endpoints.forEach(endpoint => endpoint.moveToParent(this))
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

  /**
   * @param {string} referenceBody 
   * @param {boolean} allowGlobalFinding 
   * @returns {Node|undefined}
   */
  resolve (referenceBody, allowGlobalFinding = true) {
    const referencePath = referenceBody.split('.')
    if (referencePath.length == 1) {
      const endpoint = this.endpoints.find(endpoint => {
        return endpoint.id == referenceBody
      })
      if (endpoint instanceof Endpoint) {
        return endpoint
      }
    }
    return super.resolve(referenceBody, allowGlobalFinding)
  }

  mock () {
    return this.fields.reduce((mock, field) => {
      const type = this.resolve(field.type.referenceName)
      if (type instanceof Entity) {
        if (field.type.isList) {
          mock[field.name] = [type.mock()]
        } else {
          mock[field.name] = type.mock()
        }
      } else {
        mock[field.name] = field.mock()
      }
      return mock
    }, {})
  }

  /**
   * 
   * @param {any} value 
   * @returns {boolean}
   */
  assert (value) {
    if (typeof value != 'object') return false

    for (const key in Object.keys(value)) {
      const field = this.findField(key)
      if (field instanceof Field) {
        if (field.assert(value[key]) == false) return false
      }
    }

    return true
  }
}