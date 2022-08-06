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
      await schema.exportKotlinCode()
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
        if (soil.options.verbose) {
          console.log(util.inspect(scenario.steps, { depth: null, colors: true }))
        }
        const rootContext = new Context()
        rootContext.setHeader('User-Agent', 'Soil Scenario Runner')
        rootContext.setHeader('Content-Type', 'application/json')
        rootContext.setHeader('Accept', 'application/json')
        const runner = new Runner(rootContext)
        try {
          runner.log('scenario file:', scenario.uri)
          for (const step of scenario.steps) {
            if (step instanceof CommandStep) {
              await runner.runCommand(step.commandName, ...step.args)
            }
            if (step instanceof RequestStep) {
              const requestContext = new Context(rootContext)
              const requestRunner = new Runner(requestContext)
              const overrides = step.overrides
              Object.keys(overrides).forEach(key => {
                if (typeof overrides[key] == 'string')
                  overrides[key] = requestContext.applyString(overrides[key])
                requestContext.setVar(key, overrides[key])
              })
              const endpoint = schema.resolveEndpoint(step.reference || step.method, requestContext.applyString(step.path))
              if (typeof endpoint == 'undefined') {
                throw new Error(`Endpoint is not found: ${requestContext.applyString(step.path)}`)
              }
              var path = requestContext.applyString(step.path || endpoint.path)
              const query = endpoint.query.filter(query => requestContext.existsVar(`$${query.name}`))
              if (query.length > 0) {
                path += '?' + query.map(query => `${query.name}=${encodeURIComponent(requestContext.resolveVar(`$${query.name}`))}`).join("&")
              }
              const response = await requestRunner.request(endpoint.method, path, endpoint.requestMock(overrides))
              runner.logs.push(...requestRunner.logs)
              if (response.status > 299) {
                console.log(response.body)
                throw new Error(`Unsuccessful Response from ${endpoint.name} ${response.status}`)
              }
              if (typeof endpoint.successResponse != 'undefined') {
                endpoint.successResponse.assert(response.body, ['response'])
              }
              const receiverContext = new Context(requestContext)
              receiverContext.setLocalVar('response', response.body)
              const receiverRunner = new Runner(receiverContext)
              try {
                for (const receiver of step.receiverSteps) {
                  await receiverRunner.runCommand(receiver.commandName, ...receiver.args)
                }
              } finally {
                runner.logs.push(...receiverRunner.logs)
              }
            }
          }
          console.log(chalk.green('  ✔'), scenario.name)
        } catch (error) {
          console.log(chalk.red('  ✖'), scenario.name)
          console.log(chalk.red(error))
        } finally {
          runner.logs.forEach(log => console.log('    ', chalk.gray(log)))
        }
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
