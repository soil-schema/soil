import path from 'node:path'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'

import Config from './Config.js'

export const configTemplate = new Config()

.addDirective('core', core => core
  .string('workingDir', '.')
  .stringTable('exportDir', {
    default: 'dist',
    swift: 'dist',
    kotlin: 'dist',
  }, 'default')
  .string('encoding', 'utf-8')
)

.addDirective('api', core => core
  /**
   * Boolean type query parsing strategy.
   * 
   * - not-accepted: if a soil schema has Boolean query parameter, crash soil command with error message.
   * - numeric: true sets query value 1, false sets query value 0.
   * - stringify: Boolean value convert to string like "true" or "false".
   * - set-only-true: true sets query value 1, but false remove key from query string.
   * - only-key: true sets key but no-value likes `?key`. false remove key from query string.
   * 
   * @see https://github.com/niaeashes/soil/issues/32
   */
  .string('booleanQuery', 'set-only-true')

  .string('base', process.env.SOIL_BASE_URL || '')

  .anyStringTable('headers')

  .optionalString('unsplash')
)

.addDirective('swift', swift => swift

  // Using package, eg: "soil-swift".
  // @see https://github.com/niaeashes/soil-swift
  .stringArray('use')

  .string('indent', '    ')

  // Import packages on each entity files.
  .stringArray('imports', ['Foundation'])

  .stringTable('protocols', {
    entity: 'Decodable',
    writer: 'Encodable',
    endpoint: null,
    requestBody: 'Encodable',
    response: 'Decodable',
  })

  .anyStringTable('mime')
)

.addDirective('kotlin', kotlin => kotlin

  // Kotlin code package name
  .optionalString('package')

  // Using package, eg: "soil-swift".
  // @see https://github.com/niaeashes/soil-swift
  .stringArray('use')

  .string('indent', '    ')

  // Import packages on each entity files.
  .stringArray('imports', ['Foundation'])

  .stringTable('annotations', {
    entity: undefined,
    writer: undefined,
    endpoint: undefined,
    requestBody: undefined,
    response: undefined,
  })

  .stringTable('interfaces', {
    entity: undefined,
    writer: undefined,
    endpoint: undefined,
    requestBody: undefined,
    response: undefined,
  })

  /**
   * About confiburation for kotlin-serialization package.
   * @see https://kotlinlang.org/docs/serialization.html
   */
  .stringTable('serializable', {
    /**
     * Type of decoding formatter class name.
     * 
     * [!] StringFormat is not stable
     * @see https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-core/kotlinx.serialization/-string-format/
     * 
     * @case Json with 'kotlin-serialization-json'
     */
    format: 'StringFormat',
  })

  .anyStringTable('mime')
)

export const loadConfig = async function () {
  try {
    return configTemplate.build((await import(path.join(process.cwd(), path.basename(soil.options.config)))).default)
  } catch (error) {
    if (soil.options.verbose) console.log(error)
    return configTemplate.build({})
  }
}

/**
 * Promise http request.
 * @param {{ url: string, method: string, body: string, headers: { [key: string]: string } }}} request 
 */
export const httpRequest = function (request) {

  const BASE_URL = process.env.BASE_URL
  const { method, headers, body, url } = request
  const use_ssl = url.startsWith('https://')
  const client = use_ssl ? https : http

  // Send http request
  return new Promise(async (resolve, reject) => {
    try {

      const req = client.request(url, { method, headers, use_ssl }, res => {
        const contentType = res.headers['content-type']
        if (contentType?.startsWith('text/') || contentType?.startsWith('application/json')) {
          res.setEncoding('utf8')
          var body = ''
          res.on('data', (/** @type {string} */ chunk) => body += chunk)
          res.on('error', reject)
          res.on('end', () => resolve({ raw: res, status: res.statusCode || 500, headers: res.headers, body }))
        } else {
          resolve({ raw: res, status: res.statusCode || 500, headers: res.headers, stream: res })
        }
      })

      req.on('error', reject)

      if (typeof body == 'string' && body.startsWith('file://')) {
        const filepath = fileURLToPath(body)
        const stat = await fs.stat(filepath)
        const stream = createReadStream(filepath)
        stream.on('open', () => stream.pipe(req))
        stream.on('error', error => {
          req.destroy(error)
          reject(error)
        })
        req.setHeader('Content-Length', stat.size)
      } else if (typeof body == 'object') {
        const json = JSON.stringify(body)
        req.setHeader('Content-Type', 'application/json; charset=utf-8')
        req.end(json)
      } else {
        req.end()
      }

    } catch (error) {
      reject(error)
    }
  })

}