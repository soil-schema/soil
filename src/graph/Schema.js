import { promises as fs } from 'node:fs'
import path from 'node:path'

import chalk from 'chalk'

import contextUtilities from '../context.js'

import Entity from './Entity.js'
import DuplicatedNameError from '../errors/DuplicatedNameError.js'
import Root from './Root.js'

export default class Schema {
  constructor(config) {
    Object.defineProperty(this, 'config', { value: config })
  }

  parse(schemas) {
    const root = new Root()
    const entities = schemas
      .forEach(schema => root.addChild(schema.name, new Entity(schema)))

    Object.defineProperty(this, 'root', { value: root, enumerable: true })
  }

  get entities () {
    return this.root.children
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
      try {
        const body = await entity.renderSwiftFile({ config: this.config, entities: this.entities, ...contextUtilities })
        fs.writeFile(file, body, this.config.encode)
        console.log(chalk.green('[Swift]', '-', file))
      } catch (error) {
        console.error(chalk.red('[Swift]', `Failure exporting to ${file}`))
        console.error(error)
      }
    })
  }

  async exportKotlinCode() {
  }

  debug () {
    if (!soil.options.verbose) { return }
    console.log(chalk.yellow('[DEBUG] print loaded schema'))
    this.entities.forEach(entity => {
      entity.inspect()
    })
  }
}
