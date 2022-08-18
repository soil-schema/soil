import fs from 'node:fs/promises'

/**
 * Framework provides Runner with access to the file system,
 * sending and receiving HTTP requests, access to config, etc...
 * 
 * By replacing methods of Framework, it is easier to test the Runner.
 */
export default class Framework {

  constructor (config) {
    this.__config = config
    this.__fs = fs
  }

  mock (name, target) {
    this[`__${name}`] = target
  }

  async readFile () {
    return this.__fs.readFile.apply(this.__fs, arguments)
  }

  async writeFile () {
    return this.__fs.writeFile.apply(this.__fs, arguments)
  }
}