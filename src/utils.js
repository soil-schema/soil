import path from 'path'

import { DEFAULT_CONFIG } from './const.js'

export const loadConfig = async function () {
  try {
    return Object.assign({}, DEFAULT_CONFIG, (await import(path.join(process.cwd(), path.basename(soil.options.config)))).default)
  } catch (error) {
    if (soil.options.verbose) console.log(error)
    return Object.assign({}, DEFAULT_CONFIG)
  }
}