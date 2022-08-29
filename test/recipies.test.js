import test from "ava";
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { marked } from 'marked'
import { parseDocument as parseHtmlDocument } from 'htmlparser2'

import { loadConfig } from '../src/config/load.js'
import Schema from '../src/graph/Schema.js'
import Tokenizer from '../src/parser/Tokenizer.js'
import Parser from '../src/parser/Parser.js'

const recipesPath = path.join(process.cwd(), 'docs/recipes')
const files = await fs.readdir(recipesPath)

const promises = files.map(async file => {
  const filepath = path.join(recipesPath, file)
  const body = await fs.readFile(filepath, { encoding: 'utf-8' })
  const html = marked(body)
  const result = parseHtmlDocument(html)

  const blocks = {}

  for (let i = 0; i < result.children.length; i++) {
    const element = result.children[i]
    if (element.name != 'h2') continue
    let current
    const name = element.firstChild.data
    const uri = pathToFileURL(filepath).toString()
    const block = { name, uri }
    while (true) {
      i += 1
      current = result.children[i]
      if (current == undefined || current.name == 'h2') break
      if (current.name == 'pre') {
        current.children.forEach(element => {
          if (element.name != 'code') return
          let generate = element.attribs['class'].replace('language-', '')
          if (generate == 'json') generate = 'mock'
          block[generate] = element.firstChild.data
        })
      }
    }
    blocks[name] = block
  }

  return blocks
})

const blocks = (await Promise.all(promises))
  .reduce((result, blocks) => Object.assign(result, blocks), {})

const config = await loadConfig({ encoding: 'utf-8' })

Object.values(blocks).forEach(block => {
  test(`${block.name} in ${block.uri}`, async t => {

    const schema = new Schema(config)
    const result = new Parser().parse(new Tokenizer(block.uri, block.soil).tokenize())

    schema.parse(result)

    t.assert(schema.entities.length == 1, 'Single recipe only supports single entity directive.')

    const entity = schema.entities[0]

    const swift = await entity.renderSwiftFile({ config, entities: schema.entities })

    if ('swift' in block) {
      t.is(block.swift.trim(), swift.trim())
    } else {
      t.fail(`Swift expectation not found:\r\n${swift}`)
    }

    const mock = JSON.stringify(entity.mock(), null, 2)

    if ('mock' in block) {
      t.is(block.mock.trim(), mock.trim())
    } else {
      t.fail(`JSON mock expectation not found:\r\n${mock}`)
    }

    t.pass()
  })
})