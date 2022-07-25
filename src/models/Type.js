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
   */
  constructor (definition) {
    Object.defineProperty(this, 'definition', { value: definition, enumerable: true })
  }

  /**
   * @param {object} context 
   * @returns {string}
   */
  resolve (context) {
    return this.definition
  }

  get isList () {
    return /^List<.+>/.test(this.definition)
  }

  get isDefinedType () {
    return DEFINED_TYPES.indexOf(this.definition) != -1
  }
}