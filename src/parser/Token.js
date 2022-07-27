export default class Token {
  /**
   * @type {string}
   */
  filepath

  /**
   * @type {number}
   */
  line

  /**
   * @type {number}
   */
  offset

  /**
   * @type {string}
   */
  token

  /**
   * 
   * @param {string} filepath 
   * @param {number} line 
   * @param {number} offset 
   * @param {string} token 
   */
  constructor (filepath, line, offset, token) {
    Object.defineProperty(this, 'filepath', { value: filepath })
    Object.defineProperty(this, 'line', { value: line })
    Object.defineProperty(this, 'offset', { value: offset })
    Object.defineProperty(this, 'token', { value: token })
  }

  /**
   * @returns {string}
   */
  toString() {
    return this.token
  }

  /**
   * 
   * @param {RegExp|string} tester 
   */
  is (tester) {
    if (tester instanceof RegExp) {
      return tester.test(this.token)
    } else {
      return this.token == tester
    }
  }

  /**
   * 
   * @param {RegExp|string} tester 
   */
  not (tester) {
    return !this.is(tester)
  }
}