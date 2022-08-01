import Runner from './Runner.js'

import VariableNotFoundError from '../errors/VariableNotFoundError.js'

export default class VariableSpace {
  /**
   * 
   * @param {VariableSpace|Runner|undefined} parent 
   */
  constructor (parent) {
    this._space = {}
    this._headers = {}
    Object.defineProperty(this, 'parent', { value: parent, enumerable: false })
  }

  get env () {
    return this.parent.env
  }

  get headers () {
    return Object.assign({}, this.parent.headers, this._headers)
  }

  setHeader (name, value) {
    if (typeof value == 'string' && value[0] == '$') {
      return this.setHeader(name, this.resolveVar(value))
    }
    this._headers[name] = value
  }

  setVar (name, value) {
    if (typeof value == 'string' && value[0] == '$') {
      return this.setVar(name, this.resolveVar(value))
    }
    this._space[`$${name}`] = value
  }

  /**
   * 
   * @param {string} code 
   * @returns 
   */
  resolveVar (code) {
    var path = code.split('.')
    const name = path.shift()

    if (path.length == 0 && typeof namespace == 'object') {
      return namespace[name.replace(/^\$/, '')]
    }

    switch (name) {
      case '$env':
        if (typeof this.env[path[0]] == 'undefined') {
          throw new VariableNotFoundError(`Variable not found \`${code}\``)
        } else {
          return this.env[path[0]]
        }
      case '$header':
        if (typeof this.headers[path[0]] == 'undefined') {
          throw new VariableNotFoundError(`Variable not found \`${code}\``)
        } else {
          return this.headers[path[0]]
        }
      default:
        if (name[0] == '$') {
          if (this._space[name] instanceof VariableSpace) {
            return this._space[name].resolveVar(path.join('.'))
          }
          if (typeof this._space[name] != 'undefined') {
            return this._space[name]
          }
          return this.parent.resolveVar(code)
        }
    }

    return void 0
  }
}