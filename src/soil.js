#!/usr/bin/env node

import util from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import chalk from 'chalk'

import { program } from 'commander'

import './swift.js'

import { loadConfig } from './config/load.js'

import Schema from './graph/Schema.js'
import Loader from './parser/Loader.js'
import Runner from './runner/Runner.js'
import ScenarioRuntimeError from './errors/ScenarioRuntimeError.js'
import Report from './runner/report/Report.js'

program
  .name('soil')
  .description('CLI to soil-schema')
  .version(process.env.npm_package_version)

program
  .command('generate')
  .summary('Generate codes')
  .description('Generate codes from soil schema under entry directories.')
  .requiredOption('-g --generators <type...>', 'must have generating code types')
  .option('-c, --config <file>', 'config file path', 'soil.config.js')
  .option('--verbose')
  .option('--dump')
  .option('--debug')
  .action(async (options, args) => {
    const config = await loadConfig(options)

    if (options.debug) {
      console.log(util.inspect(config, { depth: null, colors: true }))
    }

    const schema = new Schema(config)
    const loader = new Loader(config)

    try {
      await loader.prepare()
      schema.parse(await loader.load())
      if (options.generators.includes('swift')) {
        await schema.exportSwiftCode()
      }
      if (options.generators.includes('kotlin')) {
        await schema.exportKotlinCode()
      }
      console.log(chalk.green('🍻 Done!'))
    } catch (error) {
      console.log(chalk.red('☄️ Crash!'), error)
    }
  })

program
  .command('replay')
  .option('-c, --config <file>', 'config file path', 'soil.config.js')
  .option('--verbose')
  .option('--debug')
  .action(async (options, args) => {
    const config = await loadConfig(options)
    const filters = [] // options.scenarios?.map(uri => pathToFileURL(uri).toString())

    if (options.verbose) {
      console.log(util.inspect(config, { depth: null, colors: true }))
    }

    const schema = new Schema(config)
    const loader = new Loader(config)
    const report = new Report()

    try {
      await loader.prepare()
      schema.parse(await loader.load())

      report.capture(schema)

      for (const scenario of schema.scenarios) {
        if (scenario.isShared) continue
        const runner = new Runner(config, schema.root)
        runner.registerReport(report)
        if (filters?.length > 0 && filters.includes(scenario.uri) == false) {
          continue // Skip
        }
        try {
          runner.log('scenario file:', scenario.uri)
          await runner.runScenario(scenario)
          console.log(chalk.green('  ✔'), scenario.name)
        } catch (error) {
          console.log(chalk.red('  ✖'), scenario.name)
          console.log(chalk.red(error))
          console.log(chalk.red(error.stack))
          if (error instanceof ScenarioRuntimeError) {
            error.report()
          }
        } finally {
          runner.logs.forEach(log => console.log('    ', chalk.gray(log)))
          const scenarioReport = runner.scenarioReport
          if (scenarioReport) {
            const body = JSON.stringify(scenarioReport, null, 2)
            fs.writeFile(path.join(config.output, `report.${scenario.name}.json`), body)
          }
        }
      }
    } catch (error) {
      console.log(chalk.red('☄️ Crash!'), error)
    } finally {
      report.export(console)
    }
  })

program
  .command('config')
  .action(async (options, args) => {
    console.log(JSON.stringify(await loadConfig(options.config), null, 2))
  })

program.parse()