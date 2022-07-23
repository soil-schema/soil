// @ts-check

import Model from './Model.js'

import '../extension.js'

export default class Field extends Model {
  /**
   * @param {string} name 
   * @param {object|string} schema 
   */
  constructor(name, schema) {
    if (typeof schema == 'string') {
      super(name, { name, define: schema })
    } else {
      super(name, { name, ...schema })
    }
  }

  /**
   * @returns {string?}
   */
  get label () {
    return null
  }

  /**
   * @returns {string}
   */
  get type () {
    /**
     * @type {{ define: string }}
     */
    var { define } = this.schema
    if (typeof define == 'undefined' && this.schema.schema) {
      // @ts-ignore
      define = this.name.classify()
    }
    const tokens = define.split(/\s/)
    // @ts-ignore
    const type = tokens[tokens.length - 1].replace('{schema}', (this.schema.name || this.name).classify())
    return type
  }

  get annotations () {
    /**
     * @type {{ define: string }}
     */
    const { define } = this.schema
    if (typeof define == 'undefined') {
      return []
    } else {
      return define.split(/\s/)
        .filter(token => token[0] == '+')
        .map(token => token.replace(/^\+/, ''))
    }
  }

  /**
   * 
   * @param {string} annotation 
   * @returns {boolean}
   */
  hasAnnotation (annotation) {
    return this.annotations.indexOf(annotation) != -1
  }
}

/*
  ================================
  Utilities
 */

Field.parse = fields => Object.keys(fields || {}).map(name => new Field(name, fields[name]))