import fs from 'node:fs/promises'
import Ajv from 'ajv'
import addFormats from "ajv-formats"
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import chalk from 'chalk'

export class ConfigValidationError extends Error {
  /**
   * 
   * @param {Ajv.ErrorObject[]} errors 
   */
  constructor(filepath, errors) {
    super(`Invalid configuration object. soil has been initialized a configuration object from ${filepath}, but it does not match configuration schema.`)
    this.errors = errors
  }

  get fullMessage () {
    return this.message + '\n' + this.errors.map(error => {
      console.log(error, error.schema, error.parentSchema)
      return `- ${chalk.red(error.instancePath.replaceAll('/', '.'), error.message, JSON.stringify(error.params))}`
    }).join('\n')
  }
}

export const applyDefaults = (config) => {
  return {
    ...config,
    entry: config.entry || '.',
    output: config.output || './dist',
    encoding: config.encoding || 'utf-8',
    api: applyDefaultApi(config.api || {}),
    swift: applyDefaultSwift(config.swift || {}),
    kotlin: applyDefaultKotlin(config.kotlin || {}),
  }
}

export const applyDefaultApi = (config) => {
  return {
    ...config,
    headers: config.headers || {},
    booleanQuery: config.booleanQuery || 'set-only-true',
    mime: config.mime || {},
  }
}

export const applyDefaultSwift = (config) => {
  return {
    ...config,
    output: config.output || './dist',
    use: config.use || [],
    imports: config.imports || ['Foundation'],
    protocols: {
      entity: 'Decodable',
      writer: 'Encodable',
      endpoint: null,
      request: 'Encodable',
      response: 'Decodable',
      ...config.protocols,
    }
  }
}

export const applyDefaultKotlin = (config) => {
  return {
    ...config,
    output: config.output || './dist',
    use: config.use || [],
    annotations: {
      entity: undefined,
      writer: undefined,
      endpoint: undefined,
      requestBody: undefined,
      response: undefined,
      ...config.annotations,
    },
    serialization: {
      ...config.serialization,
      format: config.serialization?.format || 'StringFormat',
    }
  }
}

export const importConfig = async (filepath) => {
  try {
    return (await import(path.join(process.cwd(), filepath))).default
  } catch (error) {
    return {}
  }
}

/**
 * 
 * @param {{ config: string|undefined, encoding: string|undefined }} options
 */
export const loadConfig = async (options) => {
  const configFile = options.config || 'soil.config.js'
  const schemaFile = path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.json')

  const userConfig = await importConfig(configFile)

  const schema = JSON.parse(await fs.readFile(schemaFile, { encoding: 'utf-8' }))
  const config = applyDefaults(userConfig)

  try {
    const ajv = new Ajv()

    // [!] https://ajv.js.org/guide/formats.html#string-formats
    addFormats(ajv)

    if (!ajv.validate(schema, config)) {
      throw new ConfigValidationError(configFile, ajv.errors)
    }
  } catch (error) {
    console.error('[soil]', chalk.red(error.fullMessage || error.message))
    process.exit(2)
  }

  return config
}