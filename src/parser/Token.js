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
  column

  /**
   * @type {string}
   */
  semantic

  /**
   * @type {string}
   */
  value

  /**
   * @type {Error[]}
   */
  errors = []

  /**
   * @type {Token[]}
   */
  subtokens = []

  /**
   * 
   * @param {{ uri: string, line: number, column: number, value: string, semantic: string|undefined }} 
   */
  constructor ({ uri, line, column, value, semantic = undefined }) {
    Object.defineProperty(this, 'uri', { value: uri })
    Object.defineProperty(this, 'line', { value: line })
    Object.defineProperty(this, 'column', { value: column })
    Object.defineProperty(this, 'value', { value: value })
    Object.defineProperty(this, 'semantic', { value: semantic, writable: true })
  }

  isSemantic (pattern) {
    if (typeof this.semantic == 'undefined') return false
    if (pattern instanceof RegExp) {
      return pattern.test(this.semantic)
    } else {
      return this.semantic.startsWith(pattern)
    }
  }

  hitAny (...keywords) {
    for (const keyword of keywords) {
      if (new RegExp(`\\b${keyword.replace('.', '\\.')}\\b`).test(this.semantic)) {
        return true
      }
    }
    return false
  }

  get debug () {
    return `${this.value.replace(/\n/g, '\\n')} // ${this.semantic} @ ${this.uri}:${this.line}:${this.column}`
  }

  buildDebugMessage (body) {
    return this.errors.map(error => {
      const splitted = body.split('\n')
      let lineLength = `${splitted.length + 1}`.length
      let captureLine = Math.max(this.line - 2, 1)
      let exportBody = []
      while (captureLine <= this.line) {
        exportBody.push(`${captureLine}`.padStart(lineLength, ' ') + ': ' + splitted[captureLine - 1])
        captureLine += 1
      }
      return `Error: ${this.uri}:${this.line}:${this.column}
${exportBody.join('\n')}
${' '.repeat(this.column + lineLength + 1)}${'^'.repeat(this.value.length)} -> ${error.message} (${this.semantic})`
    }).join('\n\n')
  }
}