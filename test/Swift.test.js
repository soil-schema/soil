import test from 'ava'
import swift from '../src/swift.js'
import Entity from '../src/graph/Entity.js'

import { applyDefaults } from '../src/config/load.js'
import contextUtilities from '../src/context.js'
import Node from '../src/graph/Node.js'

const context = {
  config: applyDefaults({}),
  ...contextUtilities,
}

class ConfigNode extends Node {
  get config () { return context.config }
}

const configNode = new ConfigNode()

test('pretty', t => {
  const tester = `
struct Sample {
  var name: String
}
`
  t.snapshot(swift.pretty(tester, context.config))
})

test('docc case 1', t => {
  // https://developer.apple.com/documentation/xcode/writing-symbol-documentation-in-your-source-files
  const comment = swift.docc({
    summary: 'Eat the provided specialty sloth food.',
    description: `Sloths love to eat while they move very slowly through their rainforest 
habitats. They are especially happy to consume leaves and twigs, which they 
digest over long periods of time, mostly while they sleep.

When they eat food, a sloth's \`energyLevel\` increases by the food's \`energy\`.`,
    parameters: {
      food: 'The food for the sloth to eat.',
      quantity: 'The quantity of the food for the sloth to eat.',
    },
  })
  t.snapshot(comment)
})

test('docc case 2', t => {
  // https://developer.apple.com/documentation/xcode/writing-symbol-documentation-in-your-source-files
  const comment = swift.docc({
    summary: 'Eat the provided specialty sloth food.',
    description: `Sloths love to eat while they move very slowly through their rainforest 
habitats. They are especially happy to consume leaves and twigs, which they 
digest over long periods of time, mostly while they sleep.

When they eat food, a sloth's \`energyLevel\` increases by the food's \`energy\`.`,
    parameters: [
      { name: 'food', description: 'The food for the sloth to eat.' },
      { name: 'quantity', description: 'The quantity of the food for the sloth to eat.' },
    ],
  })
  t.snapshot(comment)
})

test('entity require writer', t => {
  const target = new Entity({
    name: 'Account',
    fields: [
      {
        name: 'name',
        type: 'String',
        annotation: 'mutable',
      },
      {
        name: 'email',
        type: 'String',
        annotation: 'writer',
      },
      {
        name: 'password',
        type: 'String',
        annotation: 'writer',
      },
    ],
  })
  const nameField = target.findField('name')
  t.is(nameField.swift_Member({ ...context, entity: target }), 'public var name: String')
  t.is(nameField.swift_Member({ ...context, entity: target, writer: target.writeOnly() }), 'public var name: String')

  target.moveToParent(configNode)

  t.snapshot(target.renderSwiftFile(context))
})

test('type reference to another entity', t => {
  const wrapper = new Entity({
    name: 'Wrapper',
    fields: [
      {
        name: 'id',
        type: 'Integer',
      },
      {
        name: 'content',
        annotation: 'mutable',
        type: 'Content',
      },
    ],
  })
  const content = new Entity({
    name: 'Content',
    fields: [
      {
        name: 'id',
        type: 'Integer',
      },
      {
        name: 'body',
        annotation: 'mutable',
        type: 'String',
      },
    ],
  })
  const configNode = new ConfigNode()
  configNode.addChild(wrapper)
  configNode.addChild(content)
  t.snapshot(wrapper.renderSwiftFile({ ...context, entities: [wrapper, content] }))
})

test('Referenced enum type query', t => {
  const target = new Entity({
    name: 'Account',
    fields: [
      {
        name: 'name',
        type: 'String',
      },
      {
        name: 'status',
        type: 'Status',
      },
    ],
    subtypes: [
      {
        name: 'Status',
        type: 'Enum',
        enum: ['item1', 'item2'],
      },
    ],
  })

  target.moveToParent(configNode)

  t.assert(target.resolve('Account') instanceof Entity)
  t.assert(target.resolve('Status') instanceof Entity)

  t.snapshot(target.renderSwiftFile(context))
})
