// --- 1. 外部引用 (Imports) ---
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 匯入類型作為 Single Source of Truth
import type { Project, Route } from '../shared/types'

// --- 3. 常量宣告 (Constants) ---
// 必須與主進程(main/index.ts)定義的通道名稱完全一致
const IPC_CHANNELS = {
  WINDOW: {
    MINIMIZE: 'window:minimize',
    MAXIMIZE: 'window:maximize',
    CLOSE: 'window:close'
  },
  DB: {
    GET_PROJECTS: 'db:getProjects',
    ADD_PROJECT: 'db:addProject',
    DELETE_PROJECT: 'db:deleteProject',
    GET_ROUTES: 'db:getRoutesByProjectId',
    ADD_ROUTE: 'db:addRoute',
    UPDATE_ROUTE: 'db:updateRoute',
    DELETE_ROUTE: 'db:deleteRoute'
  }
} as const

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 封裝暴露給渲染進程的 API 物件
 * 每個函數都應該有明確的類型定義
 */
const api = {
  windowControls: {
    minimize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW.MINIMIZE),
    maximize: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW.MAXIMIZE),
    close: (): void => ipcRenderer.send(IPC_CHANNELS.WINDOW.CLOSE)
  },

  db: {
    /** 獲取所有專案 */
    getProjects: (): Promise<Project[]> => ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PROJECTS),

    /** * 新增專案
     * @param project - 排除自動生成欄位的專案資料
     */
    addProject: (
      project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>
    ): Promise<Project> => ipcRenderer.invoke(IPC_CHANNELS.DB.ADD_PROJECT, project),

    /** 刪除專案 */
    deleteProject: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.DB.DELETE_PROJECT, id),

    /** 根據專案 ID 獲取路由 */
    getRoutesByProjectId: (projectId: string): Promise<Route[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.DB.GET_ROUTES, projectId),

    /** 新增路由 */
    addRoute: (route: Omit<Route, 'id'>): Promise<Route> =>
      ipcRenderer.invoke(IPC_CHANNELS.DB.ADD_ROUTE, route),

    /** 更新路由 */
    updateRoute: (route: Route): Promise<Route | null> =>
      ipcRenderer.invoke(IPC_CHANNELS.DB.UPDATE_ROUTE, route),

    /** 刪除路由 */
    deleteRoute: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.DB.DELETE_ROUTE, id)
  }
}

// --- 9. 暴露 API 到渲染進程 (Context Bridge) ---

if (process.contextIsolated) {
  try {
    // 暴露 Electron 預設工具
    contextBridge.exposeInMainWorld('electron', electronAPI)
    // 暴露自定義業務 API
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('[Preload] Failed to expose context bridge:', error)
  }
} else {
  // 非隔離環境的回退方案 (通常僅用於舊版相容)
  // @ts-ignore: electron property is defined via global augmentation in index.d.ts
  window.electron = electronAPI
  // @ts-ignore: api property is defined via global augmentation in index.d.ts
  window.api = api
}
