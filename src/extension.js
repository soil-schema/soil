import pluralize from 'pluralize'

/**
 * @returns {string}
 * @memberof String
 */
String.prototype.classify = function () {
  var classify = ''
  var upNext = true
  for (var c of pluralize.singular(this)) {
    if (c == '-' || c == '_' || c == ' ') {
      upNext = true
      continue
    }
    classify += upNext ? c.toUpperCase() : c.toLowerCase()
    upNext = false
  }
  return classify
}

/**
 * @returns {string}
 */
String.prototype.camelize = function () {
  var camelize = ''
  var upNext = false
  for (var c of this) {
    if (c == '-' || c == '_' || c == ' ') {
      upNext = true
      continue
    }
    camelize += upNext ? c.toUpperCase() : c.toLowerCase()
    upNext = false
  }
  return camelize
}

Array.prototype.joinCode = function (separator = '\n') {
  return this
    .filter(item => item != null && item != '')
    .join(separator)
}

Array.prototype.joinParameter = function (separator = ', ') {
  return this.filter(item => typeof item == 'string').join(separator)
}
