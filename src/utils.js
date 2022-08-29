import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import https from 'node:https'

/**
 * Promise http request.
 * @param {{ url: string, method: string, body: string, headers: { [key: string]: string } }}} request 
 */
export const httpRequest = function (request) {

  const BASE_URL = process.env.BASE_URL
  const { method, headers, body, url } = request
  const use_ssl = url.startsWith('https://')
  const client = use_ssl ? https : http

  // Send http request
  return new Promise(async (resolve, reject) => {
    try {

      const req = client.request(url, { method, headers, use_ssl }, res => {
        const contentType = res.headers['content-type']
        if (contentType?.startsWith('text/') || contentType?.startsWith('application/json')) {
          res.setEncoding('utf8')
          var body = ''
          res.on('data', (/** @type {string} */ chunk) => body += chunk)
          res.on('error', reject)
          res.on('end', () => resolve({ raw: res, status: res.statusCode || 500, headers: res.headers, body }))
        } else {
          resolve({ raw: res, status: res.statusCode || 500, headers: res.headers, stream: res })
        }
      })

      req.on('error', reject)

      if (typeof body == 'string' && body.startsWith('file://')) {
        const filepath = fileURLToPath(body)
        const stat = await fs.stat(filepath)
        const stream = createReadStream(filepath)
        stream.on('open', () => stream.pipe(req))
        stream.on('error', error => {
          req.destroy(error)
          reject(error)
        })
        req.setHeader('Content-Length', stat.size)
      } else if (typeof body == 'string') {
        req.setHeader('Content-Type', 'application/json; charset=utf-8')
        req.end(body)
      } else if (typeof body == 'object') {
        const json = JSON.stringify(body)
        req.setHeader('Content-Type', 'application/json; charset=utf-8')
        req.setHeader('Content-Length', Buffer.byteLength(json))
        req.end(json)
      } else {
        req.end()
      }

    } catch (error) {
      reject(error)
    }
  })

}