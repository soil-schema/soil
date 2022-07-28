// @ts-check

import Model from "./Node.js";

import '../extension.js'

export default class Query extends Model {

  /**
   * @param {string} name 
   * @param {object} schema 
   */
  constructor (name, schema) {
    super(name, { ...schema, name })
  }

  /**
   * @type {string}
   */
  get type () {
    if (this.schema.type == 'Enum') {
      if (this.isSelfDefinedEnum) {
        // @ts-ignore
        return `${this.name.classify()}Value`
      } else {
        return this.schema.enum
      }
    }
    return this.schema.type || 'String'
  }

  get defaultValue () {
    return this.schema.default
  }

  get enumValues () {
    const enumValues = this.schema.enum
    if (Array.isArray(enumValues)) {
      return enumValues
    }
    return []
  }

  /**
   * @type {boolean}
   */
  get isEnum () {
    return this.schema.type == 'Enum'
  }

  /**
   * @type {boolean}
   */
  get isSelfDefinedEnum () {
    return this.isEnum && Array.isArray(this.schema.enum)
  }

  /**
   * @returns {boolean}
   */
  get optional () {
    if (this.schema.default) {
      return false
    }
    return true
  }
}

Query.parse = queryList => Object.keys(queryList || {}).map(name => new Query(name, queryList[name]))