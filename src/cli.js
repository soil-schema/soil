import { program } from 'commander'

program
  .option('--working-dir <dir>')
  .option('-c, --config <file>')
  .option('--with-validate')
  .option('--watch')
  .option('--verbose')

program.parse()

const DEFAULT_OPTIONS = {
  workingDir: void 0,
  config: 'soil.config.js',
  watch: void 0,
  verbose: void 0,
  withValidate: void 0,
}

export const options = Object.assign({}, DEFAULT_OPTIONS, program.opts())

global.soil = { options }

export default { options }