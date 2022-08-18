import chalk from 'chalk'

export class EndpointReport {

  constructor (endpoint) {
    this.endpoint = endpoint
    this.count = 0
  }

  match (endpoint) {
    return this.endpoint === endpoint
  }

  increment () {
    this.count += 1
  }

}

export default class CoverageReport {

  constructor () {
    this.endpoints = {}
  }

  /**
   * 
   * @param {Endpoint} endpoint 
   */
  registerEndpoint (endpoint) {
    this.endpoints[endpoint.uid] = new EndpointReport(endpoint)
  }

  check (endpoint) {
    if (typeof endpoint == 'undefined') return
    this.endpoints[endpoint.uid]?.increment()
  }

  export (writer) {

    var passed = 0
    var endpoints = Object.values(this.endpoints)
      .sort((a, b) => a.endpoint.path.localeCompare(b.endpoint.path))

    writer.group('Called')
    endpoints
      .filter(report => report.count)
      .forEach(report => {
        writer.log(chalk.green('✔'), report.endpoint.reportSignature, chalk.gray(`(${report.count} times)`))
        passed += 1
      })
    writer.groupEnd()

    writer.group('Not called or failed')
    endpoints
      .filter(report => !report.count)
      .forEach(report => {
        writer.log(chalk.red('✖'), report.endpoint.reportSignature)
        writer.log(' ', chalk.gray(report.endpoint.uri))
      })
    writer.groupEnd()

    if (endpoints.length > 0) {
      writer.log(`${Math.floor(passed / endpoints.length * 100)}% (${passed}/${endpoints.length})`)
    }
  }
}