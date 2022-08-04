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
  .string('package')

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