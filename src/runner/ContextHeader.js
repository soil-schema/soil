export default class ContextHeader {
  /**
   * @type {string}
   * @readonly
   */
  name

  /**
   * @type {value}
   * @readonly
   */
  value

  /**
   * @type {boolean}
   * @readonly
   */
  secure

  /**
   * 
   * @param {string} name 
   * @param {string} value 
   * @param {{ secure: boolean }} options 
   */
  constructor (name, value, options = {}) {
    Object.defineProperty(this, 'name', { value: name })
    Object.defineProperty(this, 'value', { value: value })

    Object.defineProperty(this, 'secure', { value: options.secure })
  }
}