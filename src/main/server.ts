import Fastify, { FastifyInstance } from 'fastify'
import { Route } from '../shared/types'

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

    // 3. 註冊路由 (暫時只做簡單的 Log，Stage 27 會完善動態掛載)
    // 即使是 Stage 26，我們也可以先把路由掛上去，或者至少讓傳入的 routes 有地方放
    // 這裡我們先做一個簡單的歡迎路由，證明 server 活著
    server.get('/', async () => {
      return { message: 'Mocky Server is running', projectId }
    })

    // TODO: Stage 27 - 遍歷 routes 並動態掛載
    // 目前先簡單印出路由數量
    console.log(`[Server] Project ${projectId} has ${routes.length} routes to mount.`)

    try {
      // 4. 啟動伺服器
      // host 設為 '0.0.0.0' 或 'localhost'
      const address = await server.listen({ port, host: '0.0.0.0' })
      const actualPort = (server.server.address() as any).port

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
