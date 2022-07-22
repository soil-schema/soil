#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import util from 'util'
import YAML from 'yaml'
import { DEFAULT_CONFIG } from './const.js'
import contextUtilities from './context.js'

import Entity from './models/Entity.js'
import './swift.js'

const loadConfig = async function () {
  
  try {
    return Object.assign({}, DEFAULT_CONFIG, (await import(path.join(process.cwd(), './soil.config.js'))).default)
  } catch (error) {
    return Object.assign({}, DEFAULT_CONFIG)
  }
}

const main = async function() {
  const config = await loadConfig()
  const soil = new Soil(config)
  await soil.prepare()
  await soil.exportSwiftCode()
  soil.debug()
}

class Soil {
  constructor(config) {
    Object.defineProperty(this, 'config', { value: config })
  }

  async prepare() {
    const workingDirPath = path.join(process.cwd(), this.config.workingDir)

    const entities = (await fs.readdir(path.join(workingDirPath, 'entity')))
      .map(async (file) => {
        const fullpath = path.join(workingDirPath, 'entity', file)
        const schema = YAML.parse(await fs.readFile(fullpath, this.config.encoding))
        return new Entity(schema)
      })

    Object.defineProperty(this, 'entities', { value: await Promise.all(entities), enumerable: true })
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
      const body = await entity.renderSwiftFile({ config: this.config, entities: this.entities, ...contextUtilities })
      fs.writeFile(path.join(process.cwd(), swiftExportDir, `${entity.name}.swift`), body, this.config.encode)
    })
  }

  async exportKotlinCode() {
  }

  debug () {
    console.log(util.inspect(this, { depth: null, colors: true }))
  }
}

main()
