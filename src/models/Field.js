// @ts-check

import Model from './Model.js'

export default class Field extends Model {
  /**
   * @param {string} name 
   * @param {object} schema 
   */
  constructor(name, schema) {
    super(name, { name, ...schema })
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
    const { define } = this.schema
    const tokens = define.split(/\s/)
    return tokens[tokens.length - 1]
  }

  get annotations () {
    /**
     * @type {{ define: string }}
     */
    const { define } = this.schema
    return define.split(/\s/)
      .filter(token => token[0] == '+')
      .map(token => token.replace(/^\+/, ''))
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