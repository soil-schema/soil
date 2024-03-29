import { promises as fs } from 'node:fs'
import { inspect } from 'node:util'
import path from 'node:path'

import chalk from 'chalk'

import contextUtilities from '../context.js'

import Entity from './Entity.js'
import Scenario from './Scenario.js'
import Root from './Root.js'
import Endpoint from './Endpoint.js'

import '../generator/kotlin.js'
import '../generator/swift.js'

export default class Schema {
  /**
   * @type {Root}
   */
  root

  /**
   * 
   * @param {any} config 
   */
  constructor(config) {
    Object.defineProperty(this, 'config', { value: config })
  }

  parse(schemas) {
    const root = new Root(this.config)
    schemas
      .entities
      .forEach(schema => root.addChild(new Entity(schema)))
    schemas
      .scenarios
      .forEach(schema => root.addChild(new Scenario(schema)))

    Object.defineProperty(this, 'root', { value: root, enumerable: true })
  }

  get entities () {
    return this.root.entities
  }

  get scenarios () {
    return this.root.scenarios
  }

  get endpoints () {
    return this.root.endpoints
  }

  async exportSwiftCode() {
    const swiftExportDir = this.config.swift.output || this.config.output

    await fs.mkdir(swiftExportDir, { recursive: true })
    this.entities.forEach(async (entity) => {
      const file = path.join(process.cwd(), swiftExportDir, `${entity.name}+Schema.swift`)
      try {
        const body = await entity.renderSwiftFile({ config: this.config, entities: this.entities, ...contextUtilities })
        await fs.writeFile(file, body, this.config.encode)
        console.log(chalk.green('[Swift]', '-', file))
      } catch (error) {
        console.error(chalk.red('[Swift]', `Failure exporting to ${file}`))
        console.error(error)
      }
    })
  }

  async exportKotlinCode() {
    const kotlinExportDir = this.config.kotlin.output || this.config.output

    await fs.mkdir(kotlinExportDir, { recursive: true })
    this.entities.forEach(async (entity) => {
      const file = path.join(process.cwd(), kotlinExportDir, `${entity.name}.kt`)
      try {
        const body = await entity.renderKotlinFile({ config: this.config, entities: this.entities, ...contextUtilities })
        await fs.writeFile(file, body, this.config.encode)
        console.log(chalk.green('[Kotlin]', '-', file))
      } catch (error) {
        console.error(chalk.red('[Kotlin]', `Failure exporting to ${file}`))
        console.error(error)
      }
    })
  }

  /**
   * 
   * @param {string} reference 
   * @param {string|undefined} path 
   * @returns {Endpoint|undefined}
   */
  resolveEndpoint (reference, path = undefined) {
    if (typeof path == 'string') {
      const method = reference
      return this.root.endpoints.find(endpoint => endpoint.score(method, path))
    } else {
      const node = this.root.resolve(reference)
      if (node instanceof Endpoint) {
        return node
      }
    }
  }
}
