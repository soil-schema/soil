#!/usr/bin/env node

import path from 'path'
import watch from 'node-watch';
import chalk from 'chalk'

import './swift.js'

import { options } from './cli.js'
import { loadConfig } from './utils.js'

import Soil from './models/Soil.js'

if (options.workingDir) {
  process.chdir(options.workingDir)
} else {
  process.chdir(path.dirname(options.config))
}

/**
 * @param {Soil} soil 
 */
const run = async function(soil) {
  try {
    await soil.prepare()
    if (options.verbose) soil.debug()
    await soil.exportSwiftCode()
    console.log(chalk.green('🍻 Done!'))
  } catch (error) {
    console.log(chalk.red('☄️ Crash!'))
    console.error(error)
  }
}

loadConfig()
  .then(config => {
    run(new Soil(config))

    if (options.watch) {
      console.log(chalk.gray('watch', process.cwd()))
      watch(process.cwd(), { recursive: true }, (evt, name) => {

        // Ignore in export directory.
        if (name.startsWith(path.join(process.cwd(), config.exportDir))) { return }

        console.log(chalk.gray(`\ndetect change: ${name}\n`))

        run(new Soil(config))
      })
    }
  })