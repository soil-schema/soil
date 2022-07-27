
export default class DuplicatedNameError extends Error {

  constructor (elementName, ...elements) {
    super(`${elementName} is duplicated`)
    this.elementName = elementName
    this.elements = elements
  }
}