import test from 'ava'
import swift from '../src/swift.js'
import { DEFAULT_CONFIG } from '../src/const.js'
import contextUtilities from '../src/context.js'
import Entity from '../src/models/Entity.js'
import Field from '../src/models/Field.js'

const context = {
  config: DEFAULT_CONFIG,
  ...contextUtilities,
}

test('pretty', t => {
  const tester = `
struct Sample {
  var name: String
}
`
  t.snapshot(swift.pretty(tester, DEFAULT_CONFIG))
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

/*
  ================================
  Entity
 */

test('Entity.renderSwiftFile', t => {
  const entity = new Entity({
    name: 'Account',
    fields: {
      name: {
        define: 'String',
      },
    },
  })
  t.notThrows(() => {
    t.snapshot(entity.renderSwiftFile(context))
  })
})

/*
  ================================
  Field
 */

test('Field.renderSwiftMember', t => {
  const field = new Field('id', {
    define: 'Integer',
  })
  t.notThrows(() => {
    t.snapshot(field.renderSwiftMember(context))
  })
})

test('Field.renderArgumentSignature', t => {
  const field = new Field('id', {
    define: 'Integer',
  })
  t.notThrows(() => {
    t.snapshot(field.renderArgumentSignature(context))
  })
})