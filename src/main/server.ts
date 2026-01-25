import Fastify, { FastifyInstance } from 'fastify'
import net from 'net'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

import { Route } from '../shared/types'
import { toOpenApi } from './utils/openapi-generator'

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

class ServerManager {
  private servers: Map<string, FastifyInstance> = new Map()

  /**
   * 檢查 Port 是否可用
   * @param port - 欲檢查的 Port
   */
  private checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const s = net.createServer()
      s.once('error', () => resolve(false))
      s.once('listening', () => {
        s.close(() => resolve(true))
      })
      s.listen(port, '0.0.0.0')
    })
  }

  /**
   * 尋找下一個可用 Port
   * @param startPort - 起始 Port
   */
  private async findAvailablePort(startPort: number): Promise<number> {
    let port = startPort
    const maxPort = 65535
    // 限制嘗試次數避免無窮迴圈
    let attempts = 0
    const maxAttempts = 100

    while (attempts < maxAttempts) {
      // 動態引入 net 模組以確保在 Node環境執行
      // 注意：在這個檔案頂部已經可以 import 'net'，這裡為了保險使用動態或直接改用頂部 helper
      const isAvailable = await this.checkPort(port)
      if (isAvailable) {
        return port
      }
      port++
      attempts++
      if (port > maxPort) {
        throw new Error('No available ports found within range')
      }
    }
    throw new Error('Unable to find an available port after multiple attempts')
  }

  /**
   * 啟動 Mock 伺服器
   * @param projectId - 專案 ID
   * @param port - 預期 Port
   * @param routes - 路由表
   * @param projectInfo - 專案資訊 (用於產生 Swagger 文件)
   * @returns 實際運行的 Port
   */
  async start(
    projectId: string,
    port: number,
    routes: Route[],
    projectInfo: { name: string; description?: string } = { name: 'Mock API' }
  ): Promise<number> {
    // 1. 如果該專案已在運行，先停止
    if (this.servers.has(projectId)) {
      await this.stop(projectId)
    }

    // 2. 尋找可用 Port
    const actualPort = await this.findAvailablePort(port)
    console.log(`[Server] Requested port ${port}, using available port ${actualPort}`)

    // 3. 建立 Fastify 實例
    const server = Fastify({ logger: true })

    // 4. 註冊 Swagger (必須在路由之前)
    const openApiDocument = toOpenApi(projectInfo, routes)

    await server.register(fastifySwagger, {
      mode: 'static',
      specification: {
        document: openApiDocument
      }
    })

    await server.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      }
    })

    // 5. 註冊路由
    console.log(`[Server] Project ${projectId} mounting ${routes.length} routes...`)

    routes.forEach((route) => {
      // Skip inactive routes
      if (!route.isActive) return

      try {
        server.route({
          method: route.method,
          url: route.path,
          handler: async (_request, reply) => {
            // 1. Delay
            if (route.response.delay > 0) {
              await new Promise((resolve) => setTimeout(resolve, route.response.delay))
            }

            // 2. Status Code
            reply.code(route.response.statusCode)

            // 3. Body
            try {
              // Attempt to parse JSON strings
              const jsonBody = JSON.parse(route.response.body)
              return jsonBody
            } catch {
              // If not JSON, return as string
              return route.response.body
            }
          }
        })
        console.log(`[Server] Mounted ${route.method} ${route.path}`)
      } catch (err) {
        console.error(`[Server] Failed to mount route ${route.method} ${route.path}:`, err)
      }
    })

    try {
      // 6. 啟動伺服器
      // host 設為 '0.0.0.0' 或 'localhost'
      const address = await server.listen({ port: actualPort, host: '0.0.0.0' })

      console.log(
        `[Server] Project ${projectId} listening on ${address}, actual port: ${actualPort}`
      )

      // 7. 存入 Map
      this.servers.set(projectId, server)

      return actualPort
    } catch (err) {
      server.log.error(err)
      throw err
    }
  }

  /**
   * 停止 Mock 伺服器
   * @param projectId - 專案 ID
   */
  async stop(projectId: string): Promise<boolean> {
    const server = this.servers.get(projectId)
    if (!server) return false

    try {
      await server.close()
      this.servers.delete(projectId)
      console.log(`[Server] Project ${projectId} stopped`)
      return true
    } catch (err) {
      console.error(`[Server] Failed to stop project ${projectId}:`, err)
      return false
    }
  }

  /**
   * 檢查專案是否正在運行
   */
  isRunning(projectId: string): boolean {
    return this.servers.has(projectId)
  }
}

export const serverManager = new ServerManager()
