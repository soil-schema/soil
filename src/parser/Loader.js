import { promises as fs } from 'node:fs'
import path from  'node:path'
import { tmpdir } from 'node:os'

import Tokenizer from './Tokenizer.js'
import Parser from './Parser.js'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

export default class Loader {

  constructor (config) {
    this.config = config
    this.result = { entities: [], scenarios: [] }
  }

  async prepare () {
    /* Nothing to do */
  }

  async load () {
    console.time('build time')
    await this.loadDirectory(path.join(process.cwd(), this.config.entry))
    console.timeEnd('build time')
    return this.result
  }

  async loadDirectory (dirpath) {

    const { encoding } = this.config

    await Promise.all((await fs.readdir(dirpath))
      .filter(file => file != 'node_modules')
      .map(file => path.join(dirpath, file))
      .map(async filepath => {
        const stat = await fs.stat(filepath)

        if (stat.isDirectory()) {
          await this.loadDirectory(filepath)
          return
        }

        // Skip a not soil file.
        if (path.extname(filepath) != '.soil') {
          return
        }

        const schema = await this.fetch(filepath, body => {
          const tokens = new Tokenizer(filepath, body).tokenize()
          const result = new Parser().parse(tokens)
          tokens.forEach(token => {
            if (token.errors.length > 0) {
              console.log(token.buildDebugMessage(body))
            }
          })
          return result
        })

        const makeSchema = (schema) => {
          return { ...schema, uri: pathToFileURL(filepath).toString() }
        }

        ['entities', 'scenarios'].forEach(key => {
          schema[key]
            .map(makeSchema)
            .forEach(entity => {
              this.result[key].push(entity)
              // if (soil.options.dump) {
              //   this.dumpSchema(entity)
              // }
            })
        })
      }))
  }

  async dumpSchema (schema) {
    const { encoding } = this.config.core
    const exportDir = this.config.core.exportDir.default

    const dumpFilename = `${schema.name}.dump.json`
    const body = JSON.stringify(schema, null, 2)
    await fs.mkdir(path.join(process.cwd(), exportDir), { recursive: true })
    await fs.writeFile(path.join(process.cwd(), exportDir, dumpFilename), body, encoding)
  }

  async fetch (filepath, block) {

    const { encoding } = this.config

    const stat = await fs.stat(filepath)
    const hash = createHash('sha256')
      .update(stat.mtimeMs.toString())
      .digest('hex')
    const cacheFilepath = path.join(tmpdir(), 'soil', `${hash}.soil.cache`)

    try {

      // cache file is json
      return JSON.parse(await fs.readFile(cacheFilepath, { encoding }))

    } catch { // cache file is not found

      const body = await fs.readFile(filepath, { encoding })
      const result = await block(body)
      const cache = JSON.stringify(result) // essentially deep clone.

      /* async cache */
      fs.mkdir(path.dirname(cacheFilepath), { recursive: true })
        .then(() => fs.writeFile(cacheFilepath, cache, { encoding }))

      return result
    }
  }
}