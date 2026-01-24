// --- 1. 外部引用 (Imports) ---
import { app } from 'electron'
import { join } from 'path'
import { randomUUID } from 'node:crypto'
import type { Low } from 'lowdb'
import { type Project, type Route, type DBSchemaType, PROJECT_STATUS } from '../shared/types'

// --- 3. 常量宣告 (Constants) ---
const DB_FILE_NAME = 'db.json'

const DEFAULT_DATA: DBSchemaType = { projects: [], routes: [] }

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

class DBService {
  private db: Low<DBSchemaType> | null = null
  private dbPath: string = ''

  constructor() {
    // 延遲初始化路徑，確保在 app ready 後調用
  }

  /**
   * 初始化資料庫連接與遷移
   * @throws {Error} 當無法載入 lowdb 或寫入檔案時
   */
  async init(): Promise<void> {
    if (this.db) return // 衛句模式

    if (!this.dbPath) {
      this.dbPath = join(app.getPath('userData'), DB_FILE_NAME)
    }

    try {
      const { JSONFilePreset } = await import('lowdb/node')
      this.db = await JSONFilePreset(this.dbPath, DEFAULT_DATA)

      // 資料庫遷移：確保 routes 陣列存在
      if (!this.db.data.routes) {
        this.db.data.routes = []
        await this.db.write()
        console.log('[DB] Migrated: Added missing routes array')
      }

      console.log('[DB] Initialized at:', this.dbPath)
    } catch (error) {
      console.error('[DB] Failed to init DB:', error)
      throw error
    }
  }

  /**
   * 獲取所有專案列表
   * @returns {Promise<Project[]>}
   */
  async getProjects(): Promise<Project[]> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')

    await this.db.read()
    return this.db.data.projects ?? [] // API 數據容錯
  }

  /**
   * 新增專案
   * @param project - 專案基礎資料
   */
  async addProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Project> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')

    const now = new Date().toISOString()
    const newProject: Project = {
      ...project,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: PROJECT_STATUS.STOPPED
    }

    await this.db.update(({ projects }) => projects.push(newProject))
    return newProject
  }

  /**
   * 刪除專案及其關聯的所有路由
   * @param id - 專案 ID
   * @returns {Promise<boolean>} 是否刪除成功
   */
  async deleteProject(id: string): Promise<boolean> {
    await this.init()
    if (!this.db || !id) return false // 衛句模式與空值檢查

    const initialLength = this.db.data.projects.length

    await this.db.update((data) => {
      const index = data.projects.findIndex((p) => p.id === id)
      if (index === -1) return

      // 移除專案
      data.projects.splice(index, 1)
      // 移除關聯路由 (解耦邏輯)
      data.routes = data.routes?.filter((r) => r.projectId !== id) ?? []
    })

    return this.db.data.projects.length < initialLength
  }

  /**
   * 根據專案 ID 獲取路由
   * @param projectId - 專案 ID
   */
  async getRoutesByProjectId(projectId: string): Promise<Route[]> {
    await this.init()
    if (!this.db || !projectId) return []

    await this.db.read()
    const routes = this.db.data.routes ?? []
    return routes.filter((r) => r.projectId === projectId)
  }

  /**
   * 新增路由
   * @param route - 路由資料 (不含 ID)
   */
  async addRoute(route: Omit<Route, 'id'>): Promise<Route> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')

    const newRoute: Route = {
      ...route,
      id: randomUUID()
    }

    // 確保 routes 陣列存在
    if (!this.db.data.routes) {
      this.db.data.routes = []
    }

    await this.db.update(({ routes }) => routes.push(newRoute))
    return newRoute
  }

  /**
   * 刪除指定路由
   * @param id - 路由 ID
   * @returns {Promise<boolean>}
   */
  async deleteRoute(id: string): Promise<boolean> {
    await this.init()
    if (!this.db || !id) return false

    const initialLength = this.db.data.routes?.length ?? 0

    await this.db.update((data) => {
      if (!data.routes) return
      const index = data.routes.findIndex((r) => r.id === id)
      if (index !== -1) {
        data.routes.splice(index, 1)
      }
    })

    const currentLength = this.db.data.routes?.length ?? 0
    return currentLength < initialLength
  }

  /**
   * 更新路由
   * @param route - 更新後的路由資料
   * @returns {Promise<Route | null>} 更新後的路由，若找不到則回傳 null
   */
  async updateRoute(route: Route): Promise<Route | null> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')

    let updatedRoute: Route | null = null

    await this.db.update((data) => {
      if (!data.routes) return
      const index = data.routes.findIndex((r) => r.id === route.id)
      if (index !== -1) {
        // 更新該筆資料 (保持 ID 與 ProjectID 不變)
        data.routes[index] = { ...data.routes[index], ...route }
        updatedRoute = data.routes[index]
      }
    })

    return updatedRoute
  }
}

// --- 10. 對外暴露 (Expose/Exports) ---
export const dbService = new DBService()
