import { promises as fs } from 'node:fs'
import path from  'node:path'

import chalk from 'chalk'

import Parser from './Parser.js'

export default class Loader {

  constructor (config) {
    this.config = config
  }

  async prepare () {
    /* Nothing to do */
  }

  async load () {
    const workingDirPath = path.join(process.cwd(), this.config.workingDir)

    return await Promise.all((await fs.readdir(path.join(workingDirPath, 'entity')))
      .map(async file => {
        const filepath = path.join(workingDirPath, 'entity', file)
        const body = await fs.readFile(filepath, this.config.encoding)
        const ext = path.extname(file)
        var schemas = []

        if (ext == '.soil') {
          const parser = new Parser(filepath, body)
          try {
            schemas = parser.parse()
          } catch (error) {
            console.error(error)
          }
          if (soil.options.verbose)
            parser.logs.forEach(log => console.log(chalk.gray(log)))
          if (soil.options.dump) {
            await fs.mkdir(path.join(process.cwd(), this.config.exportDir), { recursive: true })
            await fs.writeFile(path.join(process.cwd(), this.config.exportDir, `dump-${file}.json`), JSON.stringify(schemas), this.config.encode)
          }
        }

        return schemas
      }))
  }
}