// --- 1. 外部引用 (Imports) ---
import { OpenAPIV3 } from 'openapi-types'
import { v4 as uuidv4 } from 'uuid'

import { Project, Route } from '../../../shared/types'

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 將 Mocky 專案資料轉換為 OpenAPI 3.0 文件格式
 * @param project - Mocky 專案資料
 * @param routes - 專案下的路由列表
 * @returns OpenAPI 3.0 格式的文件物件
 */
export const toOpenApi = (project: Project, routes: Route[]): OpenAPIV3.Document => {
  const paths: OpenAPIV3.PathsObject = {}

  routes.forEach((route) => {
    // 確保 path 存在
    if (!paths[route.path]) {
      paths[route.path] = {}
    }

    const pathItem = paths[route.path]!
    const method = route.method.toLowerCase() as OpenAPIV3.HttpMethods

    // 嘗試解析 response body 為 JSON example
    let example
    try {
      example = JSON.parse(route.response.body)
    } catch {
      // 如果不是有效的 JSON，則作為字串處理
      // 但 OpenAPI example 通常期望結構化數據，若 body 是純字串也行
      example = route.response.body
    }

    const operation: OpenAPIV3.OperationObject = {
      summary: route.description,
      responses: {
        [route.response.statusCode.toString()]: {
          description: 'Mock response',
          content: {
            'application/json': {
              example: example
            }
          }
        }
      }
    }

    pathItem[method] = operation
  })

  return {
    openapi: '3.0.0',
    info: {
      title: project.name,
      version: '1.0.0',
      description: project.description
    },
    paths: paths
  }
}

/**
 * 將 OpenAPI 3.0 文件解析為 Mocky 內部資料格式
 * 注意：目前不支援 $ref 引用解析，僅處理完整內嵌的物件
 * @param document - OpenAPI 3.0 文件物件
 * @returns 包含專案基礎資料與路由列表的物件
 */
export const fromOpenApi = (
  document: OpenAPIV3.Document
): { project: Partial<Project>; routes: Partial<Route>[] } => {
  const project: Partial<Project> = {
    name: document.info.title || 'Imported Project',
    description: document.info.description
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
          // 提取回傳值
          let statusCode = 200
          let body = '{}'

          if (operation.responses) {
            // 優先找 2xx 的回應
            const successKey =
              Object.keys(operation.responses).find((k) => k.startsWith('2')) ||
              Object.keys(operation.responses)[0] // 若無 2xx，取第一個

            if (successKey) {
              const code = parseInt(successKey)
              if (!isNaN(code)) statusCode = code

              const responseObj = operation.responses[successKey] as OpenAPIV3.ResponseObject
              // 這裡簡化處理，不支援 $ref 解析，假設是完整物件
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

          const route: Partial<Route> = {
            id: uuidv4(),
            // projectId 將由外部建立專案後填入
            path: path,
            method: method.toUpperCase() as Route['method'],
            description: operation.summary || operation.description || '',
            isActive: true, // 預設啟用
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
