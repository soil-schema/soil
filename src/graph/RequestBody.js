// @ts-check

import Node from './Node.js'
import Entity from './Entity.js'
import Field from './Field.js'
import AssertionError from '../errors/AssertionError.js'

export default class RequestBody extends Node {
  /**
   * @param {object|string} schema 
   */
  constructor(schema) {
    super('RequestBody', schema || {})

    this.schema.fields?.forEach(field => this.addChild(new Field(field.name, field)))
  }

  get mimeType () {
    return this.schema.mime?.replace(/^mime:/, '')
  }

  /**
   * @returns {Array<object>}
   */
  resolveParameters() {

    if (typeof this.schema == 'string') { return [] }

    return this.schema.fields
      ?.map(field => {
        const { name } = field
        const schema = field
        const definition = typeof schema == 'string' ? schema : schema.type
        const optional = definition[definition.length - 1] == '?'

        const reference = this.resolve(definition.replace(/\?$/, ''))
        if (reference instanceof Entity && reference.requireWriter && !reference.isWritable) {
          return { ...schema, name, type: `${reference.name}.Writer${optional ? '?' : ''}` }
        }

        return { ...schema, name, type: definition }
      })
  }

  /**
   * @type {Field[]}
   */
   get fields () {
    // @ts-ignore
    return this.findAny(node => node instanceof Field)
  }

  /**
   * @param {string} name 
   * @returns {Field?}
   */
  findField (name) {
    return this.fields.find(field => field.name == name) || null
  }

  mock () {
    if (typeof this.schema == 'undefined') {
      return void 0
    }
    if (typeof this.schema == 'string') {
      // @ts-ignore
      return this.resolve(this.schema).mock()
    }
    const mock = this.fields
      .reduce((mock, field) => {
        mock[field.name] = field.mock()
        return mock
      }, {})
    if (Object.keys(mock).length == 0) return undefined
    return mock
  }

  /**
   * 
   * @param {any} value 
   * @param {string[]} path
   * @returns {boolean}
   */
  assert (value, path = []) {
    if (typeof value != 'object') {
      if (this.schema.mime?.startsWith('mime:image/') && value.startsWith('file://')) return true
      throw new AssertionError(`Expect object, but actual request body is not object (${typeof value}) at ${path.join('.')}`)
    }

    for (const field of this.fields) {
      if (field.name in value) continue
      throw new AssertionError(`Field not found: ${field.name} at ${path.join('.')}`)
    }

    for (const key in value) {
      const field = this.findField(key)
      if (field instanceof Field) {
        field.assert(value[key], path.concat([key]), { write: true })
      }
    }

    return true
  }
}