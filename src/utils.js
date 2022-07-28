import path from 'path'

import { DEFAULT_CONFIG } from './const.js'

export const mergeConfig = function (base, custom) {
  if (base === null && typeof custom != 'undefined') {
    return custom
  }
  if (typeof base != 'object' && typeof custom != 'undefined') {
    return custom
  }
  if (typeof custom == 'undefined') {
    return base
  }
  const result = {}
  Object.keys(base).forEach(key => {
    result[key] = mergeConfig(base[key], custom[key])
  })
  return result
}

export const loadConfig = async function () {
  try {
    return mergeConfig(DEFAULT_CONFIG, (await import(path.join(process.cwd(), path.basename(soil.options.config)))).default)
  } catch (error) {
    if (soil.options.verbose) console.log(error)
    return DEFAULT_CONFIG
  }
}