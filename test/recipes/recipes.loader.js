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
    let current
    const name = element.firstChild.data
    const uri = pathToFileURL(filepath).toString()
    const block = { name, uri }
    while (true) {
      i += 1
      current = result.children[i]
      if (current == undefined || current.name == 'h2') {
        i -= 1 // Cancel `i++` on for loop.
        break
      }
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

export const blocks = (await Promise.all(promises))
  .reduce((result, blocks) => Object.assign(result, blocks), {})

export const config = await loadConfig({ encoding: 'utf-8' })