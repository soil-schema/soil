// @ts-check

import { DEFINED_TYPES } from "../const.js"

export default class Type {
  /**
   * @type {string}
   * @readonly
   */
  definition

  /**
   * @param {string} definition 
   * @param {object} options
   */
  constructor (definition, options = {}) {
    Object.defineProperty(this, 'definition', { value: definition, enumerable: true })
    Object.defineProperty(this, 'options', { value: options, enumerable: true })
  }

  /**
   * @param {object} context 
   * @returns {string}
   */
  resolve (context) {
    return this.definition
  }

  get referenceName () {
    if (this.isList) {
      return this.definition.replace(/^List<(.+)\??>\??/, '$1')
    } else {
      return this.definition.replace(/^(.+)\??/, '$1')
    }
  }

  /**
   * @type {boolean}
   */
  get isList () {
    return /^List<.+>/.test(this.definition)
  }

  /**
   * @type {boolean}
   */
  get isDefinedType () {
    return DEFINED_TYPES.indexOf(this.definition) != -1
  }

  /**
   * @type {boolean}
   */
  get isAutoDefiningType () {
    return this.definition == 'Enum'
  }
}