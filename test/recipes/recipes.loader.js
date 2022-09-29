import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { marked } from 'marked'
import { parseDocument as parseHtmlDocument } from 'htmlparser2'

import { loadConfig } from '../../src/config/load.js'

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
    let currentNode
    /** @type {string} */
    let currentName
    const name = element.firstChild.data
    const uri = pathToFileURL(filepath).toString()
    const block = { name, uri }
    while (true) {
      i += 1
      currentNode = result.children[i]
      if (currentNode == undefined || currentNode.name == 'h2') {
        i -= 1 // Cancel `i++` on for loop.
        break
      }
      if (currentNode.name == 'h3') {
        currentName = currentNode.firstChild?.data
      }
      if (currentNode.name == 'pre') {
        currentNode.children.forEach(element => {
          if (element.name != 'code') return
          let generate = element.attribs['class'].replace('language-', '')
          if (generate == 'json') generate = 'mock'
          if (currentName?.toLocaleLowerCase() == 'config') generate = 'config'
          block[generate] = element.firstChild.data
        })
      }
    }
    blocks[name] = block
  }

  return blocks
})

export const blocks = (await Promise.all(promises))
  .reduce((result, blocks) => Object.assign(result, blocks), {})