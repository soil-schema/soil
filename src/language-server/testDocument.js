import JsonRpcServer from '../json-rpc/Server.js'
import Parser from '../parser/Parser.js'
import Tokenizer from '../parser/Tokenizer.js'

/**
 * @param {JsonRpcServer}
 */
export const installListeners = async server => {

  server.defineMethod('textDocument/didOpen', async function (request) {
    console.log(request.params.textDocument)
    const { uri, text } = request.params.textDocument
    if (!this.textDocuments) {
      this.textDocuments = {}
    }
    this.textDocuments[uri] = text
  })

  server.defineMethod('textDocument/didChange', async function (request) {
    console.log(request.params.textDocument)
    const { uri, text } = request.params.textDocument
    if (!this.textDocuments) {
      this.textDocuments = {}
    }
    this.textDocuments[uri] = text
  })

  server.defineMethod('textDocument/semanticTokens/full', async function (request) {
    const { uri } = request.params.textDocument
    const { tokenTypes } = this
    const body = this.textDocuments[uri]
    if (typeof body === 'undefined' || typeof tokenTypes == 'undefined') return

    console.log('Found text document body:', uri)

    var data = []

    const tokens = new Tokenizer(uri, body).tokenize()
    var line = 0
    var column = 0
    tokens.forEach(token => {
      // if (token.errors.length > 0) {
      //   console.log(token.buildDebugMessage(body))
      // }
      var tokenIndex = undefined
      if (token.isSemantic(/punctuation/)) {
        return // Skip
      } else if (token.isSemantic(/keyword/)) {
        tokenIndex = tokenTypes.indexOf('keyword')
      } else if (token.isSemantic(/comment/)) {
        tokenIndex = tokenTypes.indexOf('comment')
      } else if (token.isSemantic('entity.name.fied')) {
        tokenIndex = tokenTypes.indexOf('property')
      } else if (token.isSemantic('entity.name.entity')) {
        tokenIndex = tokenTypes.indexOf('struct')
      } else if (token.isSemantic(/entity\.name/)) {
        tokenIndex = tokenTypes.indexOf('namespace')
      } else if (token.isSemantic(/type/)) {
        tokenIndex = tokenTypes.indexOf('type')
      } else if (token.isSemantic(/function\.command/)) {
        tokenIndex = tokenTypes.indexOf('function')
      } else if (token.isSemantic(/string/)) {
        tokenIndex = tokenTypes.indexOf('string')
      } else if (token.isSemantic('parameter.assignment')) {
        tokenIndex = tokenTypes.indexOf('string')
      }
      if (typeof tokenIndex == 'undefined') {
        console.log('Skip token type:', token.semantic)
        return
      }
      if (token.line - 1 == line) {
        data.push(0, token.column - 1 - column, token.value.length, tokenIndex, 0)
      } else {
        data.push(token.line - 1 - line, token.column - 1, token.value.length, tokenIndex, 0)
      }
      line = token.line - 1
      column = token.column - 1
    })

    return {
      data,
    }
  })
}