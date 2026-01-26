// --- 1. 外部引用 (Imports) ---
import { ElectronAPI } from '@electron-toolkit/preload'
// 匯入 shared/types 的型別定義作為 Single Source of Truth
import type { Project, Route } from '../shared/types'

// --- 2. 類型定義 (Type Definitions) ---

/**
 * 視窗控制相關 API
 */
interface WindowControls {
  /** 最小化當前視窗 */
  minimize: () => void
  /** 最大化或還原當前視窗 */
  maximize: () => void
  /** 關閉當前視窗 */
  close: () => void
}

/**
 * 資料庫操作 API (IPC 通訊)
 */
interface DatabaseAPI {
  /** * 獲取所有專案列表
   * @returns 專案陣列的 Promise
   */
  getProjects: () => Promise<Project[]>

  /**
   * 新增專案
   * @param project - 專案基礎資料 (排除自動生成的 ID 與時間戳)
   */
  addProject: (
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => Promise<Project>

  /**
   * 更新專案
   * @param project - 更新的專案資料
   */
  updateProject: (
    project: Pick<Project, 'id' | 'name' | 'port' | 'description'>
  ) => Promise<Project>

  /**
   * 根據 ID 刪除專案
   * @param id - 專案 UUID
   * @returns 是否刪除成功
   */
  deleteProject: (id: string) => Promise<boolean>

  /**
   * 獲取指定專案下的所有路由規則
   * @param projectId - 專案 UUID
   */
  getRoutesByProjectId: (projectId: string) => Promise<Route[]>

  /**
   * 新增路由 (修正遺漏的定義)
   */
  addRoute: (route: Omit<Route, 'id'>) => Promise<Route>

  /**
   * 根據 ID 刪除路由 (修正遺漏的定義)
   */
  deleteRoute: (id: string) => Promise<boolean>

  /**
   * 更新路由
   * @param route - 完整的路由物件
   */
  updateRoute: (route: Route) => Promise<Route | null>

  /**
   * 重新排序路由
   */
  reorderRoutes: (projectId: string, routes: Route[]) => Promise<boolean>
}

interface ServerAPI {
  start: (payload: {
    projectId: string
    port: number
    routes: Route[]
    projectInfo: { name: string; description?: string }
  }) => Promise<number>
  stop: (projectId: string) => Promise<boolean>
}

interface ProjectAPI {
  export: (content: string, filename?: string) => Promise<boolean>
  exportHtml: (payload: { project: Project; routes: Route[] }) => Promise<boolean>
  import: () => Promise<string | null>
}

// --- 9. 全域擴充 (Global Augmentation) ---

declare global {
  interface Window {
    /** Electron 預設 API */
    electron: ElectronAPI
    /** 專案自定義暴露的 API */
    api: {
      windowControls: WindowControls
      db: DatabaseAPI
      server: ServerAPI
      project: ProjectAPI
    }
  }
}

// 重新匯出，確保前端可以使用這些介面
export type { Project, Route }
