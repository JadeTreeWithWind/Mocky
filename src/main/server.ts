import Fastify, { type FastifyInstance } from 'fastify'
import net from 'net'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyCors from '@fastify/cors'

import type { Route } from '../shared/types'
import { toOpenApi } from './utils/openapi-generator'

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

// --- 3. 常量宣告 (Constants) ---
const MAX_PORT_ATTEMPTS = 100
const DEFAULT_HOST = '0.0.0.0'

class ServerManager {
  private servers: Map<string, FastifyInstance> = new Map()
  private _queues: Map<string, Promise<void>> = new Map()

  /**
   * Serialize operations per project to avoid race conditions
   */
  private _enqueue<T>(projectId: string, task: () => Promise<T>): Promise<T> {
    const prev = this._queues.get(projectId) || Promise.resolve()

    const next = prev.then(task)

    // Ensure the queue chain continues even if this task fails
    // We append a catch handler to the promise chain but do not return it.
    // The returned promise 'next' will propagate errors to the caller.
    const nextSignal = next.catch(() => {})
    this._queues.set(projectId, nextSignal as Promise<void>)

    return next
  }

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
      s.listen(port, DEFAULT_HOST)
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

    while (attempts < MAX_PORT_ATTEMPTS) {
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
    return this._enqueue(projectId, async () => {
      // 1. 如果該專案已在運行，先停止 (Internal logic inside queue)
      if (this.servers.has(projectId)) {
        await this._stopInternal(projectId)
      }

      // 2. 尋找可用 Port
      // Note: If we just stopped the server, the port SHOULD be available,
      // but we wait a tiny bit just in case of OS lag
      await new Promise((r) => setTimeout(r, 100))

      const actualPort = await this.findAvailablePort(port)
      console.log(`[Server] Requested port ${port}, using available port ${actualPort}`)

      // 3. 建立 Fastify 實例
      const server = Fastify({
        logger: true,
        forceCloseConnections: true
      })

      // 4. 註冊 Middleware
      // CORS (Stage 5)
      await server.register(fastifyCors, {
        origin: '*' // Allow all origins for dev/testing
      })

      // 註冊 Swagger (必須在路由之前)
      // Pass actual server URL for "Try it out"
      const openApiDocument = toOpenApi(
        {
          ...projectInfo,
          serverUrl: `http://localhost:${actualPort}`
        },
        routes
      )

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
        const address = await server.listen({ port: actualPort, host: DEFAULT_HOST })

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
    })
  }

  /**
   * 停止 Mock 伺服器
   * @param projectId - 專案 ID
   */
  async stop(projectId: string): Promise<boolean> {
    return this._enqueue(projectId, () => this._stopInternal(projectId))
  }

  /**
   * 內部停止邏輯 (不經過 Queue，供 Start 內部呼叫)
   */
  private async _stopInternal(projectId: string): Promise<boolean> {
    const server = this.servers.get(projectId)
    if (!server) return false

    try {
      // Force close if it takes too long
      const closePromise = server.close()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Close timeout')), 2000)
      )

      await Promise.race([closePromise, timeoutPromise]).catch((err) => {
        console.warn(`[Server] Close warning for ${projectId}:`, err)
      })

      this.servers.delete(projectId)
      console.log(`[Server] Project ${projectId} stopped`)
      return true
    } catch (err) {
      console.error(`[Server] Failed to stop project ${projectId}:`, err)
      // Even if error, we remove it from map assuming it's dead or unusable
      this.servers.delete(projectId)
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
