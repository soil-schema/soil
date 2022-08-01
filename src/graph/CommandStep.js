export default class CommandStep {
  constructor (name, args) {
    this.name = name
    this.args = args
  }

  execute (env) {
    const commandName = this.name.replaceAll('-', '_').replace(/^@/, '')
    if (typeof this[commandName] == 'function') {
      console.log('run', commandName)
      this[commandName](env)
    } else {
      throw new Error(`Unknown Command: ${this.name}`)
    }
  }

  set_header (env) {
    const [name, value] = this.args
    env.log('set current context header:', name, value)
    env.setHeader(name, value)
  }

  set_var (env) {
    const [name, value] = this.args
    env.log('set current context var:', name, value)
    env.setVar(name, value)
  }
}