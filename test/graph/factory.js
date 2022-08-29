import Entity from '../../src/graph/Entity.js'

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