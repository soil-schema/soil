import { promises as fs } from 'node:fs'
import path from 'node:path'
import util from 'node:util'

import chalk from 'chalk'

import contextUtilities from '../context.js'

import Entity from './Entity.js'

export default class Schema {
  constructor(config) {
    Object.defineProperty(this, 'config', { value: config })
  }

  async prepare(schemas) {
    const entities = schemas
      .map(schema => new Entity(schema))
    Object.defineProperty(this, 'entities', { value: entities, enumerable: true })
  }

  async exportOpenApiSchema() {
  }

  async exportSwiftCode() {
    var swiftExportDir = this.config.exportDir

    if (typeof swiftExportDir == 'object') {
      swiftExportDir = swiftExportDir.swift || swiftExportDir.default
    }
    await fs.mkdir(swiftExportDir, { recursive: true })
    this.entities.forEach(async (entity) => {
      const file = path.join(process.cwd(), swiftExportDir, `${entity.name}.swift`)
      const body = await entity.renderSwiftFile({ config: this.config, entities: this.entities, ...contextUtilities })
      fs.writeFile(file, body, this.config.encode)
      console.log(chalk.green('export [Swift]', '-', file))
    })
  }

  async exportKotlinCode() {
  }

  debug () {
    if (!soil.options.verbose) { return }
    console.log(chalk.yellow('[DEBUG] print loaded schema'))
    console.log(util.inspect(this, { depth: null, colors: true }))
  }
}
