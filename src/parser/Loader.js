import { promises as fs } from 'node:fs'
import url from 'node:url'
import path from  'node:path'

import chalk from 'chalk'
import YAML from 'yaml'
import { validate } from 'jsonschema'

import Parser from './Parser.js'

const ENTITY_SCHEMA_PATH = path.join(url.fileURLToPath(import.meta.url), '../../../json-schema/entity.yml')

export default class Loader {

  constructor (config) {
    this.config = config
  }

  async prepare () {
    this.entityJsonSchema = YAML.parse(await fs.readFile(ENTITY_SCHEMA_PATH, 'utf-8'))
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
          const parser = new Parser()
          schemas = parser.parse(body)
          if (soil.options.verbose)
            parser.logs.forEach(log => console.log(chalk.gray(log)))
        }

        if (ext == '.yml') {
          schemas = [YAML.parse(body)]
        }

        if (soil.options.withValidate) {
          schemas.forEach(schema => {
            const result = validate(schema, this.entityJsonSchema)
            if (result.valid == false) {
              result.errors.forEach(error => {
                console.log(error, error.instance)
              })
              console.log({ schema, result, errors: result.errors })
              throw result
            }
          })
        }

        return schemas
      }))
  }
}