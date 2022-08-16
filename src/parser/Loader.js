import { promises as fs } from 'node:fs'
import path from  'node:path'

import chalk from 'chalk'

import Tokenizer from './Tokenizer.js'
import Parser from './Parser.js'
import { pathToFileURL } from 'node:url'

export default class Loader {

  constructor (config) {
    this.config = config
    this.result = { entities: [], scenarios: [] }
  }

  async prepare () {
    /* Nothing to do */
  }

  async load () {
    console.time('total')
    await this.loadDirectory(path.join(process.cwd(), this.config.core.workingDir))
    console.timeEnd('total')
    return this.result
  }

  async loadDirectory (dirpath) {

    await Promise.all((await fs.readdir(dirpath))
      .map(async file => {
        if (file == 'node_modules') return
        const filepath = path.join(dirpath, file)
        const stat = await fs.stat(filepath)

        if (stat.isDirectory()) {
          await this.loadDirectory(filepath)
          return
        }

        const body = await fs.readFile(filepath, this.config.core.encoding)
        const ext = path.extname(file)

        if (ext == '.soil') {
          console.time(filepath)
          const tokens = new Tokenizer(filepath, body).tokenize()
          const parser = new Parser()
          const schema = parser.parse(tokens)
          console.timeEnd(filepath)
          if (soil.options.dump) {
            const exportDir = this.config.core.exportDir.default
            await fs.mkdir(path.join(process.cwd(), exportDir), { recursive: true })
            await fs.writeFile(path.join(process.cwd(), exportDir, `dump-${file}.json`), JSON.stringify(schema, null, 2), this.config.encode)
          }
          tokens.forEach(token => {
            if (token.errors.length > 0) {
              console.log(token.buildDebugMessage(body))
            }
          })
          const makeSchema = (schema) => {
            return { ...schema, uri: pathToFileURL(filepath).toString() }
          }
          schema.entities
            .map(makeSchema)
            .forEach(entity => this.result.entities.push(entity))
          schema.scenarios
            .map(makeSchema)
            .forEach(scenario => this.result.scenarios.push(scenario))
        }
      }))
  }
}