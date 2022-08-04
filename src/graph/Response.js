// @ts-check

import Node from './Node.js'
import Field from './Field.js'

export default class Response extends Node {

  /**
   * @param {object} schema 
   */
  constructor(schema) {
    super('Response', schema || {})

    Object.keys(this.schema.fields || {}).forEach(name => {
      this.addChild(name, new Field(name, this.schema.fields[name]))
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
}