
import Token from '../parser/Token.js'

export default class SyntaxError extends Error {

  /**
   * @type {Token[]}
   */
  tokens

  constructor () {
    const args = Array.from(arguments)
    var tokens = []
    var message = []
    args.forEach(arg => {
      if (arg instanceof Token) {
        message.push(`Token \`${arg.token}\` at ${arg.address}`)
        tokens.push(arg)
      }
      if (typeof arg == 'string') {
        message.push(arg)
      }
    })
    super(message.join('\n'))
    this.tokens = tokens
  }
}