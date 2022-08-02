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
import Runner from './runner/Runner.js'
import CommandStep from './graph/CommandStep.js'
import Context from './runner/Context.js'
import RequestStep from './graph/RequestStep.js'

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
      schema.parse(await loader.load())
      await schema.exportSwiftCode()
      console.log(chalk.green('🍻 Done!'))
    } catch (error) {
      console.log(chalk.red('☄️ Crash!'), error)
    }
  },
  watch: async () => {
    console.log(chalk.gray('watch', process.cwd()))
    watch(process.cwd(), { recursive: true }, async (evt, name) => {
      if (path.extname(name) == '.soil') {
        console.log(chalk.gray(`\ndetect change: ${name}\n`))
        try {
          await commands.build()
        } catch (error) {
          console.error(error)
        }
      }
    })
  },
  replay: async () => {
    const config = await loadConfig()

    if (soil.options.debug) {
      console.log(util.inspect(config, { depth: null, colors: true }))
    }

    const schema = new Schema(config)
    const loader = new Loader(config)
  
    try {
      await loader.prepare()
      schema.parse(await loader.load())
      schema.debug()
      for (const scenario of schema.scenarios) {
        console.log('Run Scenario:', scenario.name)
        if (soil.options.verbose) {
          console.log(util.inspect(scenario.steps, { depth: null, colors: true }))
        }
        const rootContext = new Context()
        const runner = new Runner(rootContext)
        for (const step of scenario.steps) {
          if (step instanceof CommandStep) {
            await runner.runCommand(step.commandName, ...step.args)
          }
          if (step instanceof RequestStep) {
            const endpoint = schema.resolveEndpoint(step)
            const overrides = step.overrides
            Object.keys(overrides).forEach(key => {
              if (typeof overrides[key] == 'string')
                overrides[key] = rootContext.applyString(overrides[key])
            })
            const response = await runner.request(endpoint.method, endpoint.path, endpoint.requestMock(overrides))
            const receiverContext = new Context(rootContext)
            receiverContext.setVar('response', response)
            const receiverRunner = new Runner(receiverContext)
            for (const receiver of step.receiverSteps) {
              await receiverRunner.runCommand(receiver.commandName, ...receiver.args)
            }
            runner.logs.push(...receiverRunner.logs)
          }
        }
        runner.logs.forEach(log => console.log(chalk.gray(log)))
      }
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
        await commands[command](options)
      } else {
        console.error('soil:', command, 'is not a soil command.')
        process.exit(1)
      }
    })

  await program.parseAsync(process.argv)
}

main()
