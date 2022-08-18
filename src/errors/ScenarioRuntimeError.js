export default class ScenarioRuntimeError extends Error {
  /**
   * @type {undefined|() => void}
   * @private
   */
  reporter

  /**
   * 
   * @param {string} message 
   * @param {undefined|() => void} reporter 
   */
  constructor (message, reporter = undefined) {
    super(message)
    this.reporter = reporter
  }

  report () {
    if (typeof this.reporter == 'function') {
      this.reporter()
    } else {
      /* Nothing to do */
    }
  }
}