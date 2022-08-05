import { promises as fs } from 'node:fs'
import path from  'node:path'

import chalk from 'chalk'

import Parser from './Parser.js'

export default class Loader {

  constructor (config) {
    this.config = config
    this.result = { entities: [], scenarios: [] }
  }

  async prepare () {
    /* Nothing to do */
  }

  async load () {
    await this.loadDirectory(path.join(process.cwd(), this.config.core.workingDir))
    return this.result
  }

  async loadDirectory (dirpath) {

    await Promise.all((await fs.readdir(dirpath))
      .map(async file => {
        const filepath = path.join(dirpath, file)
        const stat = await fs.stat(filepath)

        if (stat.isDirectory()) {
          await this.loadDirectory(filepath)
          return
        }

        const body = await fs.readFile(filepath, this.config.core.encoding)
        const ext = path.extname(file)

        if (ext == '.soil') {
          const parser = new Parser(filepath, body)
          parser.parse()
          if (soil.options.verbose)
            parser.logs.forEach(log => console.log(chalk.gray(log)))
          if (soil.options.dump) {
            const exportDir = this.config.core.exportDir.default
            await fs.mkdir(path.join(process.cwd(), exportDir), { recursive: true })
            const dump = { entities: parser.entities, scenarios: parser.scenarios }
            await fs.writeFile(path.join(process.cwd(), exportDir, `dump-${file}.json`), JSON.stringify(dump, null, 2), this.config.encode)
          }
          parser.entities.forEach(entity => this.result.entities.push(entity))
          parser.scenarios.forEach(scenario => this.result.scenarios.push(scenario))
        }
      }))
  }
}