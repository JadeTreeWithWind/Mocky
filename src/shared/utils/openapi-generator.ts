import { OpenAPIV3 } from 'openapi-types'
import { v4 as uuidv4 } from 'uuid'
import { Project, Route } from '../types'

export interface ProjectInfo {
  name: string
  description?: string
  version?: string
  serverUrl?: string
}

/**
 * 轉換 Mocky 專案資料為 OpenAPI 3.0 文件
 * (Merged from Main and Renderer implementations)
 */
export const toOpenApi = (project: ProjectInfo | Project, routes: Route[]): OpenAPIV3.Document => {
  const paths: OpenAPIV3.PathsObject = {}

  routes.forEach((route) => {
    if (!route.isActive) return

    // 1. Convert path parameters: /users/:id -> /users/{id}
    const pathParams: string[] = []
    const openApiPath = route.path.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      pathParams.push(paramName)
      return `{${paramName}}`
    })

    if (!paths[openApiPath]) {
      paths[openApiPath] = {}
    }

    // 2. Build Operation Object
    const operation: OpenAPIV3.OperationObject = {
      summary: route.description || route.path,
      tags: route.tags,
      responses: {
        [route.response.statusCode.toString()]: {
          description: 'Mock response',
          content: {
            'application/json': {
              example: parseBody(route.response.body)
            }
          }
        }
      }
    }

    // 3. Add parameters
    if (pathParams.length > 0) {
      operation.parameters = pathParams.map((name) => ({
        name,
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        }
      }))
    }

    // 4. Assign to paths
    const method = route.method.toLowerCase() as OpenAPIV3.HttpMethods
    paths[openApiPath]![method] = operation
  })

  const doc: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title: project.name,
      description: project.description,
      version: 'version' in project && project.version ? project.version : '1.0.0'
    },
    paths
  }

  if ('serverUrl' in project && project.serverUrl) {
    doc.servers = [{ url: project.serverUrl }]
  }

  return doc
}

/**
 * 解析 OpenAPI 3.0 文件為 Mocky 格式
 * (From Renderer implementation)
 */
export const fromOpenApi = (
  document: OpenAPIV3.Document
): { project: Partial<Project>; routes: Partial<Route>[] } => {
  const project: Partial<Project> = {
    name: document.info.title || 'Imported Project',
    description: document.info.description,
    version: document.info.version || '1.0.0'
  }

  const routes: Partial<Route>[] = []

  if (document.paths) {
    Object.entries(document.paths).forEach(([path, pathItem]) => {
      if (!pathItem) return

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head']

      methods.forEach((method) => {
        const operation = pathItem[method as keyof OpenAPIV3.PathItemObject] as
          | OpenAPIV3.OperationObject
          | undefined

        if (operation) {
          let statusCode = 200
          let body = '{}'

          if (operation.responses) {
            const successKey =
              Object.keys(operation.responses).find((k) => k.startsWith('2')) ||
              Object.keys(operation.responses)[0]

            if (successKey) {
              const code = parseInt(successKey)
              if (!isNaN(code)) statusCode = code

              const responseObj = operation.responses[successKey] as OpenAPIV3.ResponseObject
              if (responseObj && responseObj.content && responseObj.content['application/json']) {
                const mediaType = responseObj.content['application/json']
                if (mediaType.example !== undefined) {
                  body = JSON.stringify(mediaType.example, null, 2)
                } else if (mediaType.examples) {
                  const firstExKey = Object.keys(mediaType.examples)[0]
                  const exampleObj = mediaType.examples[firstExKey]
                  if (exampleObj && 'value' in exampleObj) {
                    body = JSON.stringify(exampleObj.value, null, 2)
                  }
                }
              }
            }
          }

          // Convert path parameters back: /{id} -> /:id
          // This is a heuristic simple conversion
          const internalPath = path.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1')

          const route: Partial<Route> = {
            id: uuidv4(),
            path: internalPath,
            method: method.toUpperCase() as Route['method'],
            description: operation.summary || operation.description || '',
            tags: operation.tags || [],
            isActive: true,
            response: {
              statusCode,
              body,
              delay: 0
            }
          }
          routes.push(route)
        }
      })
    })
  }

  return { project, routes }
}

// Helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBody(body: string): any {
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}
