export const DEFAULT_CONFIG = {
  workingDir: '.',
  exportDir: 'dist',
  encoding: 'utf-8',
  swift: {

    // Using package, eg: "soil-swift".
    // @see https://github.com/niaeashes/soil-swift
    use: undefined,
    
    indent: '    ',

    // Import packages on each entity files.
    imports: ['Foundation'],

    // Protocols for each element in generated code.
    protocols: {
      entity: 'Decodable',
      writer: 'Encodable',
      endpoint: null,
      requestBody: 'Encodable',
      response: 'Decodable',
    },

    mime: {},
  },
  profile: {
    /**
     * name: {
     *   host: api.example.com,
     *   endpoint: /v1,
     * }
     */
  },
  dev: {
    port: 8080,
  },
  html: {
    style: ['./soil.css'],
  },
}

export const DEFINED_TYPES = [
  'String',
  'Integer',
  'Number',
  'Boolean',
  'URL',
  'Timestamp',
  'Date',
]

export const HTTP_METHOD_GET = "GET"
export const HTTP_METHOD_POST = "POST"
export const HTTP_METHOD_PUT = "PUT"
export const HTTP_METHOD_PATCH = "PATCH"
export const HTTP_METHOD_DELETE = "DELETE"
export const HTTP_METHOD_HEAD = "HEAD"