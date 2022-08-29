export default class ScenarioReport {

  /**
   * 
   * @param {string} name Scenario Name
   * @param {string} uri Scenario File URI
   */
  constructor (name, uri) {
    this.name = name
    this.uri = uri
    this.timestamp = new Date()
    this.commandLogs = []
    this.logs = []
  }

  logCommand (name, args) {
    this.commandLogs.push({
      command: `${name}(${args.join(', ')})`,
    })
  }
}