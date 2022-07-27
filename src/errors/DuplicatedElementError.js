
export default class DuplicatedElementError extends Error {

  constructor (elementName, ...elements) {
    this.elementName = elementName
    this.elements = elements
  }
}