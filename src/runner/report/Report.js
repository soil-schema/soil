import CoverageReport from './CoverageReport.js'

import { Console } from 'node:console'
import { Writable } from 'node:stream'

export default class Report {
  constructor () {
    this.coverage = new CoverageReport()
  }

  capture (root) {
    root.endpoints.forEach(this.coverage.registerEndpoint.bind(this.coverage))
  }

  /**
   * 
   * @param {Console|Writable} writer 
   */
  export (writer) {
    if (writer instanceof Writable) {
      this.export(new Console(writer))
    }

    writer.group("Coverage")
    this.coverage.export(writer)
    writer.groupEnd()
  }
}