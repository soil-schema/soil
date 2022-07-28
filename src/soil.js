#!/usr/bin/env node

import path from 'path'
import util from 'node:util'
import watch from 'node-watch'
import chalk from 'chalk'

import './swift.js'

import './cli.js'
import { loadConfig } from './utils.js'

import Schema from './models/Schema.js'
import Loader from './parser/Loader.js'

if (soil.options.workingDir) {
  process.chdir(soil.options.workingDir)
} else {
  process.chdir(path.dirname(soil.options.config))
}

/**
 * @param {Soil} soil 
 */
const run = async function(config) {
  const soil = new Schema(config)
  const loader = new Loader(config)

  try {
    await loader.prepare()
    await soil.prepare((await loader.load()).flatMap(c => c))
    await soil.debug()
    await soil.exportSwiftCode()
    console.log(chalk.green('🍻 Done!'))
  } catch (error) {
    console.log(chalk.red('☄️ Crash!'))
    throw error
  }
}

loadConfig()
  .then(config => {
    console.log(util.inspect(config, { depth: null, colors: true }))
    run(config)

    if (soil.options.watch) {
      console.log(chalk.gray('watch', process.cwd()))
      const exportDir = path.join(process.cwd(), config.exportDir)
      watch(process.cwd(), { recursive: true }, (evt, name) => {

        // Ignore in export directory.
        if (name.startsWith(exportDir)) { return }

        console.log(chalk.gray(`\ndetect change: ${name}\n`))

        run(config)
          .catch(console.error)
      })
    }
  })