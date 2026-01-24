// --- 1. 外部引用 (Imports) ---
import Fastify, { FastifyInstance } from 'fastify'
import { AddressInfo } from 'net'

import { Route } from '../shared/types'

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

class ServerManager {
  private servers: Map<string, FastifyInstance> = new Map()

  /**
   * 啟動 Mock 伺服器
   * @param projectId - 專案 ID
   * @param port - 預期 Port
   * @param routes - 路由表
   * @returns 實際運行的 Port
   */
  async start(projectId: string, port: number, routes: Route[]): Promise<number> {
    // 1. 如果該專案已在運行，先停止
    if (this.servers.has(projectId)) {
      await this.stop(projectId)
    }

    // 2. 建立 Fastify 實例
    const server = Fastify({ logger: true })

    // 3. 註冊路由
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
      // 4. 啟動伺服器
      // host 設為 '0.0.0.0' 或 'localhost'
      const address = await server.listen({ port, host: '0.0.0.0' })
      const serverAddress = server.server.address() as AddressInfo | null
      const actualPort = serverAddress?.port ?? port

      console.log(
        `[Server] Project ${projectId} listening on ${address}, actual port: ${actualPort}`
      )

      // 5. 存入 Map
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
