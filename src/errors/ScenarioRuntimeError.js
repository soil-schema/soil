export default class ScenarioRuntimeError extends Error {
  /**
   * @type {() => void}
   * @private
   */
  reporter

  /**
   * 
   * @param {string} message 
   * @param {() => void} reporter 
   */
  constructor (message, reporter = () => {}) {
    super(message)
    this.reporter = reporter
  }

  report () {
    this.reporter()
  }
}