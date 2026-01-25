import fs from 'fs'
import path from 'path'
import { generateRedocHtml } from './src/main/utils/htmlGenerator'

const dummySpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0'
  },
  paths: {
    '/hello': {
      get: {
        summary: 'Say Hello',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Hello World' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

const html = generateRedocHtml(dummySpec, 'Test API Docs')
const outputPath = path.resolve(__dirname, 'test.html')

fs.writeFileSync(outputPath, html)
console.log(`Generated HTML to: ${outputPath}`)
