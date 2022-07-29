#!/usr/bin/env node

import path from 'node:path'
import util from 'node:util'
import watch from 'node-watch'
import chalk from 'chalk'

import { program } from 'commander'

import './swift.js'

import { loadConfig } from './utils.js'

import Schema from './graph/Schema.js'
import Loader from './parser/Loader.js'

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
  watch: async () => {
    console.log(chalk.gray('watch', process.cwd()))
    watch(process.cwd(), { recursive: true }, async (evt, name) => {
      if (path.extname(name) == '.yml' || path.extname(name) == '.soil') {
        console.log(chalk.gray(`\ndetect change: ${name}\n`))
        try {
          await commands.build()
        } catch (error) {
          console.error(error)
        }
      }
    })
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
        console.error('soil:', command, 'is not a soil command.')
        process.exit(1)
      }
    })

  await program.parseAsync(process.argv)
}

main()
