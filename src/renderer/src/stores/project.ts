// --- 1. 外部引用 (Imports) ---
import { defineStore } from 'pinia'
import { ref } from 'vue'
// 直接使用全域定義的型別，確保 Single Source of Truth
import { type Project, type Route, PROJECT_STATUS } from '../../../shared/types'

// --- 7. 核心邏輯與 Store 定義 ---

export const useProjectStore = defineStore('project', () => {
  // --- 4. 響應式狀態 (State) ---
  const projects = ref<Project[]>([])
  const routes = ref<Route[]>([])
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)
  /** 儲存各專案實際運行的 Port (Key: ProjectId, Value: Port) */
  const runningPorts = ref<Record<string, number>>({})

  // --- 7. 核心邏輯與函數 (Actions) ---

  /**
   * 從資料庫獲取所有專案列表
   * ... (methods continue)
   */
  const fetchProjects = async (): Promise<void> => {
    isLoading.value = true
    lastError.value = null

    try {
      // 移除 @ts-ignore，直接使用定義好的 API
      const data = await window.api.db.getProjects()
      projects.value = data ?? [] // API 數據容錯
    } catch (error) {
      lastError.value = '無法載入專案列表'
      console.error('[Store] Fetch projects failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 建立新專案
   * @param payload - 專案基礎資料
   */
  const createProject = async (payload: {
    name: string
    port: number
    description: string
  }): Promise<Project> => {
    lastError.value = null

    try {
      const newProject = await window.api.db.addProject(payload)
      projects.value.push(newProject)
      return newProject
    } catch (error) {
      lastError.value = '專案建立失敗'
      console.error('[Store] Create project failed:', error)
      throw error
    }
  }

  /**
   * 刪除指定專案及其關聯路由
   * @param id - 專案 UUID
   */
  const deleteProject = async (id: string): Promise<void> => {
    if (!id) return // 衛句模式

    try {
      const success = await window.api.db.deleteProject(id)
      if (success) {
        projects.value = projects.value.filter((p) => p.id !== id)
        // 同步清除運行狀態
        if (runningPorts.value[id]) {
          delete runningPorts.value[id]
        }
      }
    } catch (error) {
      console.error('[Store] Delete project failed:', error)
      throw error
    }
  }

  /**
   * 獲取指定專案的所有路由設定
   * @param projectId - 專案 UUID
   */
  const fetchRoutes = async (projectId: string): Promise<void> => {
    if (!projectId) {
      routes.value = []
      return
    }

    isLoading.value = true
    routes.value = [] // 開始獲取前先清空，避免舊數據閃爍

    try {
      const data = await window.api.db.getRoutesByProjectId(projectId)
      routes.value = data ?? []
    } catch (error) {
      console.error('[Store] Fetch routes failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 檢查並重啟伺服器 (Hot Reload - Stage 29)
   * 當路由資料變更時，若該專案正在運行，則自動重啟以套用變更
   */
  const checkAndRestartServer = async (projectId: string): Promise<void> => {
    if (runningPorts.value[projectId]) {
      console.log(`[Store] Hot Reload: Restarting server for project ${projectId}...`)
      await startServer(projectId)
    }
  }

  /**
   * 建立新路由 (預設值)
   * @param projectId - 專案 UUID
   * @returns {Promise<string>} 新增的路由 ID
   */
  const createRoute = async (projectId: string): Promise<string> => {
    if (!projectId) throw new Error('Project ID is required')

    lastError.value = null

    try {
      const payload = {
        projectId,
        method: 'GET' as const,
        path: '/new-endpoint',
        description: 'New API Endpoint',
        isActive: true,
        response: {
          statusCode: 200,
          body: '{\n  "message": "Hello World"\n}',
          delay: 0
        }
      }

      const newRoute = await window.api.db.addRoute(payload)
      routes.value.push(newRoute)

      // Hot Reload
      await checkAndRestartServer(projectId)

      return newRoute.id
    } catch (error) {
      console.error('[Store] Create route failed:', error)
      lastError.value = '無法建立新路由'
      throw error
    }
  }

  /**
   * 刪除指定路由
   * @param id - 路由 ID
   */
  const deleteRoute = async (id: string): Promise<void> => {
    if (!id) return

    // 暫存 projectId 以便後續重啟判斷
    const route = routes.value.find((r) => r.id === id)
    const projectId = route?.projectId

    try {
      const success = await window.api.db.deleteRoute(id)
      if (success) {
        routes.value = routes.value.filter((r) => r.id !== id)

        // Hot Reload
        if (projectId) {
          await checkAndRestartServer(projectId)
        }
      }
    } catch (error) {
      console.error('[Store] Delete route failed:', error)
      lastError.value = '無法刪除路由'
      throw error
    }
  }

  /**
   * 更新路由
   * @param route - 完整的路由資料
   */
  const updateRoute = async (route: Route): Promise<void> => {
    lastError.value = null
    try {
      await window.api.db.updateRoute(JSON.parse(JSON.stringify(route))) // 確保移除 Proxy

      // Hot Reload
      await checkAndRestartServer(route.projectId)
    } catch (error) {
      console.error('[Store] Update route failed:', error)
      lastError.value = '無法更新路由'
      throw error
    }
  }

  /**
   * 啟動 Mock 伺服器
   */
  const startServer = async (projectId: string): Promise<number | void> => {
    const project = projects.value.find((p) => p.id === projectId)
    if (!project) return

    try {
      const actualPort = await window.api.server.start({
        projectId,
        port: project.port,
        routes: JSON.parse(JSON.stringify(routes.value))
      })

      // 更新狀態
      project.status = PROJECT_STATUS.RUNNING
      // 記錄實際運行的 Port
      runningPorts.value[projectId] = actualPort

      console.log(`[Store] Server started on port ${actualPort}`)
      return actualPort
    } catch (error) {
      console.error('[Store] Failed to start server:', error)
      lastError.value = '無法啟動伺服器'
      throw error
    }
  }

  /**
   * 停止 Mock 伺服器
   */
  const stopServer = async (projectId: string): Promise<void> => {
    try {
      const success = await window.api.server.stop(projectId)
      if (success) {
        const project = projects.value.find((p) => p.id === projectId)
        if (project) {
          project.status = PROJECT_STATUS.STOPPED
        }
        // 清除運行 Port 記錄
        if (runningPorts.value[projectId]) {
          delete runningPorts.value[projectId]
        }
      }
    } catch (error) {
      console.error('[Store] Failed to stop server:', error)
      lastError.value = '無法停止伺服器'
      throw error
    }
  }

  /**
   * 獲取指定專案的運行 Port
   */
  const getRunningPort = (projectId: string): number | undefined => {
    return runningPorts.value[projectId]
  }

  // --- 10. 對外暴露 (Exports) ---
  return {
    // State
    projects,
    routes,
    isLoading,
    lastError,
    runningPorts,
    // Actions
    fetchProjects,
    createProject,
    deleteProject,
    fetchRoutes,
    createRoute,
    deleteRoute,
    updateRoute,
    startServer,
    stopServer,
    getRunningPort
  }
})
