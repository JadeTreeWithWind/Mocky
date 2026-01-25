// --- 1. 外部引用 (Imports) ---
// (本檔案無外部依賴)

// --- 3. 常量宣告 (Constants) ---

/**
 * IPC 通訊頻道名稱定義
 * 作為 Main Process 與 Preload 的 Single Source of Truth
 * 防止魔術字串導致的通道名稱不一致問題
 */
export const IPC_CHANNELS = {
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
  },
  SERVER: {
    START: 'server:start',
    STOP: 'server:stop'
  },
  PROJECT: {
    EXPORT: 'project:export',
    EXPORT_HTML: 'project:exportHtml',
    IMPORT: 'project:import' // Placeholder for future
  }
} as const

// --- 10. 類型匯出 (Type Exports) ---
export type IpcChannels = typeof IPC_CHANNELS
