// @ts-check

import Node from './Node.js'
import Root from './Root.js'
import Field from './Field.js'
import Endpoint from './Endpoint.js'
import Writer from './Writer.js'

import '../extension.js'
import AssertionError from '../errors/AssertionError.js'

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

    this.schema.fields?.forEach(field => {
      this.addChild(new Field(field.name, field))
    })

    this.schema.endpoints?.forEach(endpoint => {
      this.addChild(new Endpoint(endpoint))
    })

    this.fields.forEach(field => {
      field.captureSubschemas()
        // @ts-ignore
        .map(subschema => this.addChild(new Entity(subschema)))
    })

    this.endpoints.forEach(endpoint => {
      endpoint.captureSubschemas()
        // @ts-ignore
        .map(subschema => this.addChild(new Entity(subschema)))
    })

    if (this.schema.subtypes) {
      this.schema.subtypes.forEach((/** @type {object} */ subschema) => {
        // @ts-ignore
        this.addChild(new Entity(subschema))
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
   * @type {Endpoint[]}
   */
  get endpoints () {
    // @ts-ignore
    return this.findAny(node => node instanceof Endpoint)
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
        const resolved = this.resolve(field.referencePath || field.type.definitionBody)
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
        const resolved = this.resolve(field.referencePath || field.type.definitionBody)
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
   * @type {boolean}
   */
  get hasMutableField () {
    for (var field of this.fields) {
      if (field.mutable) return true
    }
    return false
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
        return endpoint.name == referenceBody
      })
      if (endpoint instanceof Endpoint) {
        return endpoint
      }
    }
    return super.resolve(referenceBody, allowGlobalFinding)
  }

  mock () {
    return this.fields.reduce((mock, field) => {
      if (field.type.isOptional) {
        mock[field.name] = null
      } else {
        const type = this.resolve(field.referencePath || field.type.definitionBody)
        if (type instanceof Entity) {
          if (field.type.isList) {
            mock[field.name] = [type.mock()]
          } else if (field.type.isMap) {
              mock[field.name] = { key: type.mock() }
          } else {
            mock[field.name] = type.mock()
          }
        } else {
          mock[field.name] = field.mock()
        }
      }
      return mock
    }, {})
  }

  /**
   * 
   * @param {any} value 
   * @param {string[]} path
   * @param {{ write: boolean }} options
   * @returns {boolean}
   */
  assert (value, path = [], options = { write: false }) {
    if (typeof value != 'object') {
      throw new AssertionError(`Expect ${this.name}, but actual value is not object (${typeof value}) at ${path.join('.')}`)
    }

    for (const field of this.fields) {
      if (field.name in value) continue
      if (field.optional) continue
      if (options.write) {
        if (field.writer == false || field.mutable == false) continue
      } else {
        if (field.writer) continue
      }
      throw new AssertionError(`Field is required, but not defined: ${field.name} at ${path.join('.')} (${Object.keys(value).join(', ')})`)
    }

    for (const key in value) {
      const field = this.findField(key)
      if (field instanceof Field) {
        field.assert(value[key], path.concat([key]), options)
      }
    }

    return true
  }
}