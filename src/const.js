export const DEFAULT_CONFIG = {
  workingDir: '.',
  exportDir: 'dist',
  encoding: 'utf-8',
  swift: {
    indent: '    ',
    imports: ['Foundation'],
    protocols: {
      entity: 'Decodable',
      writeOnlyEntity: 'Encodable',
      endpoint: null,
      requestBody: 'Encodable',
      response: 'Decodable',
    },
  },
}

export const HTTP_METHOD_GET = "GET"
export const HTTP_METHOD_POST = "POST"
export const HTTP_METHOD_PUT = "PUT"
export const HTTP_METHOD_PATCH = "PATCH"
export const HTTP_METHOD_DELETE = "DELETE"
export const HTTP_METHOD_HEAD = "HEAD"