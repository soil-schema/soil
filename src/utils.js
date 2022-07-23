import path from 'path'

import { DEFAULT_CONFIG } from './const.js'

export const loadConfig = async function (options) {
  try {
    return Object.assign({}, DEFAULT_CONFIG, (await import(path.join(options.workingDir, options.config))).default)
  } catch (error) {
    return Object.assign({}, DEFAULT_CONFIG)
  }
}