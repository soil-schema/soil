#!/usr/bin/env node

import path from 'path'
import { program } from 'commander'
import util from 'node:util'
import watch from 'node-watch'
import chalk from 'chalk'

import './swift.js'

import { loadConfig } from './utils.js'

import Schema from './graph/Schema.js'
import Loader from './parser/Loader.js'

/**
 * @param {object} config
 */
const run = async function(config) {
}

const commands = {
  build: async () => {
    const config = await loadConfig()

    if (soil.options.debug) {
      console.log(util.inspect(config, { depth: null, colors: true }))
    }

    const schema = new Schema(config)
    const loader = new Loader(config)
  
    try {
      await loader.prepare()
      schema.parse((await loader.load()).flatMap(c => c))
      schema.debug()
      await schema.exportSwiftCode()
      console.log(chalk.green('🍻 Done!'))
    } catch (error) {
      console.log(chalk.red('☄️ Crash!'), error)
    }
  },
}

async function main() {
  program
    .argument('[command]', 'subcommand', 'build')
    .option('--working-dir <dir>')
    .option('-c, --config <file>', 'config file path', 'soil.config.js')
    .option('--with-validate')
    .option('--verbose')
    .option('--dump')
    .action(async (command, options) => {

      if (options.workingDir) {
        process.chdir(options.workingDir)
      } else {
        process.chdir(path.dirname(options.config))
      }

      global.soil = { options }

      if (typeof commands[command] == 'function') {
        await commands[command]()
      } else {
        throw new Error('soil:', command, 'is not a soil command.')
      }
    })

  await program.parseAsync(process.argv)
}

main()
