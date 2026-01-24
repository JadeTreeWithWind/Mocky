// --- 1. 外部引用 (Imports) ---
import { defineStore } from 'pinia'
import { ref } from 'vue'
// 直接使用全域定義的型別，確保 Single Source of Truth
import type { Project, Route } from '../../../shared/types'

// --- 7. 核心邏輯與 Store 定義 ---

export const useProjectStore = defineStore('project', () => {
  // --- 4. 響應式狀態 (State) ---
  const projects = ref<Project[]>([])
  const routes = ref<Route[]>([])
  const isLoading = ref(false)
  const lastError = ref<string | null>(null)

  // --- 7. 核心邏輯與函數 (Actions) ---

  /**
   * 從資料庫獲取所有專案列表
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

  // --- 10. 對外暴露 (Exports) ---
  return {
    // State
    projects,
    routes,
    isLoading,
    lastError,
    // Actions
    fetchProjects,
    createProject,
    deleteProject,
    fetchRoutes
  }
})
