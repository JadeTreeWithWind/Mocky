import { OpenAPIV3 } from 'openapi-types'
import { Route } from '../../shared/types'

export interface ProjectInfo {
  name: string
  description?: string
  version?: string
  serverUrl?: string // For "Try it out" functionality
}

export const toOpenApi = (project: ProjectInfo, routes: Route[]): OpenAPIV3.Document => {
  const paths: OpenAPIV3.PathsObject = {}

  routes.forEach((route) => {
    if (!route.isActive) return

    // 1. Convert path parameters: /users/:id -> /users/{id}
    // And extract parameter names
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
      responses: {
        [route.response.statusCode]: {
          description: 'Mock response',
          content: {
            'application/json': {
              example: parseBody(route.response.body)
            }
          }
        }
      }
    }

    // 3. Add parameters if any
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
    // OpenAPI keys are lowercase http methods
    const method = route.method.toLowerCase() as OpenAPIV3.HttpMethods
    paths[openApiPath]![method] = operation
  })

  const doc: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title: project.name,
      description: project.description,
      version: project.version || '1.0.0'
    },
    paths
  }

  // 5. Add Server URL if provided
  if (project.serverUrl) {
    doc.servers = [{ url: project.serverUrl }]
  }

  return doc
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseBody(body: string): any {
  try {
    return JSON.parse(body)
  } catch {
    // If not valid JSON, return as string
    return body
  }
}
