export default class CommandStep {
  constructor (name, args) {
    this.name = name
    this.args = args || []
  }

  get commandName () {
    return this.name.replaceAll('-', '_').replace(/^@/, '')
  }
}