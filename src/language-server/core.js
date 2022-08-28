import { Console } from 'node:console'
import { createWriteStream } from 'node:fs'

import JsonRpcServer from '../json-rpc/Server.js'
import { installListeners as textDocument } from './testDocument.js'

/**
 * Caller of each languager server methods.
 */
export class Core {

  constructor () {
    this.logger = new Console(createWriteStream('./logs/lsp.log', { flags: 'a', encoding: 'utf-8' }))
    this.logger.log('Initialize LSP Core')
  }

  makeGlobalConsole() {
    global.console = this.logger
  }
}

/**
 * @param {JsonRpcServer}
 */
export const installListeners = async server => {

  server.defineMethod('initialize', async function (request) {
    this.logger.log('Call initialize')
    const { tokenTypes } = request.params.capabilities?.textDocument?.semanticTokens || {}
    this.logger.log({ tokenTypes })
    this.tokenTypes = tokenTypes
    const capabilities = {
      textDocumentSync: 1,
      semanticTokensProvider: {
        legend: {
          tokenTypes,
          tokenModifiers: [],
        },
        range: false,
        full: true,
      },
    }
    return {
      capabilities,
    }
  })

  server.defineMethod('initialized', async function (request) {
    this.logger.log(request)
  })

  server.defineMethod('logMessage', async function () {

  })

  textDocument(server)
}