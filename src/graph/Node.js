// @ts-check

import chalk from 'chalk'
import DuplicatedNameError from '../errors/DuplicatedNameError.js'

export default class Node {

  /**
   * @type {string|undefined}
   * @readonly
   */
  id

  /**
   * @type {string}
   * @readonly
   */
  name

  /**
   * @type {object}
   */
  schema

  /**
   * @type {object}
   * @private
   */
  _children

  /**
   * @type {Node|undefined}
   * @private
   */
  _parent

  /**
   * @param {string} name 
   * @param {object} schema 
   */
  constructor(name, schema) {
    Object.defineProperty(this, 'name', { value: name, enumerable: true })
    Object.defineProperty(this, 'schema', { value: Object.freeze(schema) })
    Object.defineProperty(this, '_children', { value: {}, enumerable: false })
    Object.defineProperty(this, 'id', { value: (schema || {}).id, enumerable: true })
  }

  get summary () {
    return this.schema.summary
  }

  get description () {
    const { description } = this.schema
    if (typeof description == 'string') {
      return description.trim()
    }
    return null
  }

  /**
   * @param {Node} parentNode 
   */
  moveToParent (parentNode) {
    if (!this.hasParent) {
      Object.defineProperty(this, '_parent', { value: parentNode, enumerable: false })
    }
  }

  /**
   * @param {string} name name of child
   * @param {Node} node actual node model (instance of Node class)
   */
  addChild (name, node) {
    if ((node instanceof Node) == false) {
      throw new Error(`Invalid instance: ${node.constructor.name}`)
    }
    if (typeof this._children[name] == 'undefined') {
      this._children[name] = node
    } else {
      throw new DuplicatedNameError(name, this._children[name], node)
    }
    if (!node.hasParent) {
      node.moveToParent(this)
    }
  }

  get children () {
    return Object.values(this._children)
  }

  get root () {
    const parent = this._parent
    if (parent) { return parent.root }
    else { return this }
  }

  get hasParent () {
    return typeof this._parent != 'undefined' && this._parent instanceof Node
  }

  /**
   * @param {(child: Node) => boolean} filter 
   * @returns {Node[]}
   */
  findAny (filter) {
    return Object.values(this._children).filter(filter)
  }

  /**
   * @param {(child: Node) => boolean} finder 
   * @returns {Node|undefined}
   */
  find (finder) {
    return Object.values(this._children).find(finder)
  }

  /**
   * 
   * @param {string} referenceBody 
   * @param {boolean} allowGlobalFinding 
   * @returns {Node|undefined}
   */
  resolve (referenceBody, allowGlobalFinding = true) {
    const referehcePath = referenceBody.split('.')
    if (referehcePath.length == 1) {
      if (this.name == referenceBody) {
        return this
      }
      const child = this.find(child => child.name == referenceBody || child.id == referenceBody)
      if (child) {
        return child
      }
      if (allowGlobalFinding && typeof this.root != 'undefined' && this.root !== this) {
        return this.root.resolve(referenceBody, false)
      }
    } else {
      var isFirstFinding = true
      // @ts-ignore
      return referehcePath.reduce((result, referenceKey) => {
        if (result instanceof Node) {
          const resolved = result.resolve(referenceKey, isFirstFinding)
          isFirstFinding = false
          return resolved
        }
        return void 0
      }, this)
    }
  }

  inspect ({ indent = '' } = {}) {
    var inspector = ['[', this.constructor.name, ']', this.name]
    if (this.summary)
      inspector.push('-', this.summary)
    console.log(indent, chalk.yellow(...inspector))
    Object.values(this._children).forEach(child => child.inspect({ indent: `${indent}  ` }))
  }

  /**
   * @param {string} newName 
   * @param {object} schema 
   */
  replace (newName, schema = {}) {
    // @ts-ignore
    return new this.constructor(newName, Object.assign({}, this.schema, schema))
  }
}