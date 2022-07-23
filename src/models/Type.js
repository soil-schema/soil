// @ts-check

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
}