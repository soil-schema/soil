export default class Token {
  /**
   * @type {string}
   */
  uri

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
  kind

  /**
   * @type {string}
   */
  token

  /**
   * 
   * @param {string} uri 
   * @param {number} line 
   * @param {number} offset 
   * @param {string} token 
   * @param {string|undefined} kind
   */
  constructor (uri, line, offset, token, kind = undefined) {
    Object.defineProperty(this, 'uri', { value: uri })
    Object.defineProperty(this, 'line', { value: line })
    Object.defineProperty(this, 'offset', { value: offset })
    Object.defineProperty(this, 'token', { value: token })
    this.kind = kind
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

  /**
   * @type {string}
   */
  get address () {
    return `${this.uri}:${this.line}:${this.offset}`
  }
}