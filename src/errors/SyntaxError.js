export default class SyntaxError extends Error {
  constructor (filepath, line, offset, message) {
    if (typeof filepath == 'object') {
      super(`Unexpected token \`${filepath.token}\` at ${filepath.filepath}:${filepath.line}:${filepath.offset}`)
    } else {
      super(`${message} at ${filepath}:${line}:${offset}`)
    }
  }
}