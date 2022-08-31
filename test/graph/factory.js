import Endpoint from '../../src/graph/Endpoint.js'
import Entity from '../../src/graph/Entity.js'
import Node from '../../src/graph/Node.js'

export const UserEntity = new Entity({
  name: 'User',
  fields: [
    { name: 'id', type: 'Integer' },
    { name: 'name', type: 'String' },
  ],
  endpoints: [
    {
      method: 'GET',
      path: '/users',
    },
    {
      method: 'GET',
      path: '/users/$id',
    },
  ],
})

export const buildTestEndpoint = (builder = (schema) => schema) => {
  const schema = {
    method: 'GET',
    path: '/test',
    name: 'test',
    query: [],
  }
  builder(schema)
  return new Endpoint(schema)
}

export class ConfigInjector extends Node {
  /**
   * 
   * @param {Node} config 
   * @returns 
   */
  inject (config) {
    this._config = config
    return this
  }

  get config () {
    return this._config || {}
  }
}