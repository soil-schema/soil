// @ts-check

import Node from './Node.js'
import Entity from './Entity.js'
import Field from './Field.js'

export default class RequestBody extends Node {
  /**
   * @param {object|string} schema 
   */
  constructor(schema) {
    super('RequestBody', schema || {})

    Object.keys(this.schema.fields || {}).forEach(name => {
      this.addChild(name, new Field(name, this.schema.fields[name]))
    })
  }

  /**
   * @returns {Array<object>}
   */
  resolveParameters() {

    if (typeof this.schema == 'string') { return [] }

    return Object.keys(this.schema.fields || {})
      .map(name => {
        const schema = this.schema.fields[name]
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
    return Object.keys(this.schema.fields || {})
      .reduce((mock, name) => {
        const value = this.resolve(this.schema.fields[name].type)
        if (value instanceof Entity && value.requireWriter) {
          mock[name] = value.writeOnly().mock()
        } else {
          // @ts-ignore
          mock[name] = value.mock()
        }
        return mock
      }, {})
  }
}