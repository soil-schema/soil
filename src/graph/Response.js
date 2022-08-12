// @ts-check

import Node from './Node.js'
import Field from './Field.js'
import AssertionError from '../errors/AssertionError.js'

export default class Response extends Node {

  /**
   * @param {object} schema 
   */
  constructor(schema) {
    super('Response', schema || {})

    this.schema.fields?.forEach(field => {
      this.addChild(new Field(field.name, field))
    })
  }

  /**
   * 
   * @param {object} context 
   * @returns 
   */
  resolveParameters (context) {

    if (this.schema.fields === null) { return [] }

    const { entity } = context

    return Object.keys(this.schema.fields || {})
      .map(name => {
        const definition = this.schema.fields[name]
        if (typeof definition == 'string') {
          return { name, type: definition }
        } else {
          return { ...definition, name }
        }
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

  /**
   * 
   * @param {any} value 
   * @param {string[]} path
   * @returns {boolean}
   */
  assert (value, path = []) {
    if (typeof value != 'object') {
      throw new AssertionError(`Expect object, but actual response is not object (${typeof value}) at ${path.join('.')}`)
    }

    for (const key in value) {
      const field = this.findField(key)
      if (field instanceof Field) {
        field.assert(value[key], path.concat([key]))
      }
    }

    return true
  }
}