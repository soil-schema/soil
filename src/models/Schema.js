import { promises as fs } from 'node:fs'
import url from "node:url";
import path from 'node:path'
import util from 'node:util'

import chalk from 'chalk'
import YAML from 'yaml'
import { validate } from 'jsonschema'

import contextUtilities from '../context.js'
import Parser from '../parser/Parser.js'

import Entity from './Entity.js'

const ENTITY_SCHEMA_PATH = path.join(url.fileURLToPath(import.meta.url), '../../../json-schema/entity.yml')

export default class Schema {
  constructor(config) {
    Object.defineProperty(this, 'config', { value: config })
  }

  async prepare() {
    const workingDirPath = path.join(process.cwd(), this.config.workingDir)
    const entitySchema = YAML.parse(await fs.readFile(ENTITY_SCHEMA_PATH, 'utf-8'))

    const entities = (await fs.readdir(path.join(workingDirPath, 'entity')))
      .map(async (file) => {
        const fullpath = path.join(workingDirPath, 'entity', file)
        if (path.extname(file) == '.yml') {
          const body = YAML.parse(await fs.readFile(fullpath, this.config.encoding))

          if (soil.options.withValidate) {
            const result = validate(body, entitySchema)
            if (result.valid == false) {
              console.log("Error!", result)
            }
          }
          return new Entity(body)
        }
        if (path.extname(file) == '.soil') {
          const body = await fs.readFile(fullpath, this.config.encoding)
          const parser = new Parser()
          return parser.parse(body)[0]
        }
      })

    Object.defineProperty(this, 'entities', { value: (await Promise.all(entities)), enumerable: true })
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
