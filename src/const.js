export const DEFAULT_CONFIG = {
  workingDir: '.',
  exportDir: 'dist',
  encoding: 'utf-8',
  swift: {
    indent: '    ',
    imports: ['Foundation'],
    protocols: {
      entity: 'Decodable',
      writer: 'Encodable',
      endpoint: null,
      requestBody: 'Encodable',
      response: 'Decodable',
    },
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