import test from 'ava'
import swift from '../src/swift.js'
import Entity from '../src/graph/Entity.js'

import { configTemplate } from '../src/utils.js'
import contextUtilities from '../src/context.js'
import Node from '../src/graph/Node.js'

const context = {
  config: configTemplate.build({}),
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
    fields: {
      name: {
        type: 'String',
        annotation: 'mutable',
      },
      email: {
        type: 'String',
        annotation: 'writer',
      },
      password: {
        type: 'String',
        annotation: 'writer',
      },
    },
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
    fields: {
      id: 'Integer',
      content: {
        annotation: 'mutable',
        type: 'Content',
      },
    },
  })
  const content = new Entity({
    name: 'Content',
    fields: {
      id: 'Integer',
      body: {
        annotation: 'mutable',
        type: 'String',
      },
    },
  })
  const entities = [wrapper, content]
  wrapper.moveToParent(configNode)
  content.moveToParent(configNode)
  t.snapshot(wrapper.renderSwiftFile({ ...context, entities }))
})