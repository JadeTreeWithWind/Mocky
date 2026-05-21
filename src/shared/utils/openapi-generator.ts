import { OpenAPIV3 } from 'openapi-types'
import { v4 as uuidv4 } from 'uuid'
import { Project, Route, RouteParameter } from '../types'

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
    const routeContentType = route.response.contentType ?? 'json'
    const mimeTypeMap: Record<string, string> = {
      json: 'application/json',
      html: 'text/html',
      text: 'text/plain',
      xml: 'application/xml',
      pdf: 'application/pdf'
    }
    const responseMimeType = mimeTypeMap[routeContentType] ?? 'application/json'

    let responseMediaType: OpenAPIV3.MediaTypeObject
    if (routeContentType === 'pdf') {
      responseMediaType = { schema: { type: 'string', format: 'binary' } as OpenAPIV3.SchemaObject }
    } else if (routeContentType === 'json') {
      const parsed = parseBody(route.response.body)
      responseMediaType = {
        schema: inferSchema(parsed) as OpenAPIV3.SchemaObject,
        example: parsed
      }
    } else {
      responseMediaType = { example: route.response.body }
    }

    const operation: OpenAPIV3.OperationObject = {
      summary: route.description || route.path,
      tags: route.tags,
      responses: {
        [route.response.statusCode.toString()]: {
          description: 'Mock response',
          content: {
            [responseMimeType]: responseMediaType
          }
        }
      }
    }

    // 3. Add parameters
    // User-defined params (query / path / header / cookie) take priority
    const userParams: OpenAPIV3.ParameterObject[] = (route.parameters ?? []).map((p) => ({
      name: p.name,
      in: p.in,
      required: p.required,
      ...(p.description ? { description: p.description } : {}),
      schema: {
        type: p.type,
        ...(p.default !== undefined && p.default !== '' ? { default: p.default } : {})
      } as OpenAPIV3.SchemaObject
    }))

    // Auto-generate path params from the URL only for names not already defined by the user
    const userPathParamNames = new Set(userParams.filter((p) => p.in === 'path').map((p) => p.name))
    const autoPathParams: OpenAPIV3.ParameterObject[] = pathParams
      .filter((name) => !userPathParamNames.has(name))
      .map((name) => ({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' } as OpenAPIV3.SchemaObject
      }))

    const allParams = [...autoPathParams, ...userParams]
    if (allParams.length > 0) {
      operation.parameters = allParams
    }

    // 4. Add requestBody (only for methods that carry a body)
    const BODY_METHODS = ['post', 'put', 'patch', 'delete']
    const method = route.method.toLowerCase() as OpenAPIV3.HttpMethods
    if (route.requestBody && BODY_METHODS.includes(method)) {
      operation.requestBody = {
        ...(route.requestBody.description ? { description: route.requestBody.description } : {}),
        required: route.requestBody.required,
        content: {
          'application/json': {
            schema: parseBody(route.requestBody.schema) as OpenAPIV3.SchemaObject
          }
        }
      }
    }

    // 5. Assign to paths
    paths[openApiPath]![method] = operation
  })

  const sortedTags = Array.from(
    new Set(routes.filter((r) => r.isActive).flatMap((r) => r.tags))
  ).sort()

  const doc: OpenAPIV3.Document = {
    openapi: '3.0.0',
    info: {
      title: project.name,
      description: project.description,
      version: 'version' in project && project.version ? project.version : '1.0.0'
    },
    tags: sortedTags.map((name) => ({ name })),
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
          const internalPath = path.replace(/\{([a-zA-Z0-9_]+)\}/g, ':$1')

          // Parse parameters
          const parameters: RouteParameter[] = []
          if (operation.parameters) {
            for (const paramOrRef of operation.parameters) {
              if ('$ref' in paramOrRef) continue
              const param = paramOrRef as OpenAPIV3.ParameterObject
              const schema =
                param.schema && !('$ref' in param.schema)
                  ? (param.schema as OpenAPIV3.SchemaObject)
                  : undefined
              const paramType = schema?.type
              parameters.push({
                id: uuidv4(),
                name: param.name,
                in: param.in as RouteParameter['in'],
                type: (paramType as RouteParameter['type']) || 'string',
                required: param.required || false,
                ...(param.description ? { description: param.description } : {}),
                ...(schema?.default !== undefined ? { default: String(schema.default) } : {})
              })
            }
          }

          // Parse requestBody (only for methods that carry a body)
          const BODY_METHODS = ['post', 'put', 'patch', 'delete']
          let requestBody: Route['requestBody'] | undefined
          if (operation.requestBody && BODY_METHODS.includes(method)) {
            const reqBodyOrRef = operation.requestBody
            if (!('$ref' in reqBodyOrRef)) {
              const reqBody = reqBodyOrRef as OpenAPIV3.RequestBodyObject
              let schema = '{}'
              const jsonContent = reqBody.content?.['application/json']?.schema
              if (jsonContent && !('$ref' in jsonContent)) {
                schema = JSON.stringify(jsonContent, null, 2)
              }
              requestBody = {
                required: reqBody.required || false,
                ...(reqBody.description ? { description: reqBody.description } : {}),
                schema
              }
            }
          }

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
            },
            parameters,
            ...(requestBody ? { requestBody } : {})
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

function inferSchema(value: unknown): OpenAPIV3.SchemaObject {
  if (value === null || value === undefined) return { nullable: true }
  if (typeof value === 'boolean') return { type: 'boolean' }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' }
  }
  if (typeof value === 'string') return { type: 'string' }
  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length > 0 ? inferSchema(value[0]) : {}
    } as OpenAPIV3.ArraySchemaObject
  }
  if (typeof value === 'object') {
    const properties: Record<string, OpenAPIV3.SchemaObject> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      properties[key] = inferSchema(val)
    }
    return { type: 'object', properties }
  }
  return {}
}
