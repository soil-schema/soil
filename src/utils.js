import path from 'path'
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
   * - only-key: true sets key but no-value likes ?key. false remove key from query string.
   * 
   * @see https://github.com/niaeashes/soil/issues/32
   */
  .string('boolean_query', 'set-only-true')
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