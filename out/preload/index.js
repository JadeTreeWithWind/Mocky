"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const IPC_CHANNELS = {
  WINDOW: {
    MINIMIZE: "window:minimize",
    MAXIMIZE: "window:maximize",
    CLOSE: "window:close"
  },
  DB: {
    GET_PROJECTS: "db:getProjects",
    ADD_PROJECT: "db:addProject",
    DELETE_PROJECT: "db:deleteProject",
    UPDATE_PROJECT: "db:updateProject",
    GET_ROUTES: "db:getRoutesByProjectId",
    ADD_ROUTE: "db:addRoute",
    UPDATE_ROUTE: "db:updateRoute",
    DELETE_ROUTE: "db:deleteRoute",
    REORDER_ROUTES: "db:reorderRoutes"
  },
  SERVER: {
    START: "server:start",
    STOP: "server:stop"
  },
  PROJECT: {
    EXPORT: "project:export",
    EXPORT_HTML: "project:exportHtml",
    IMPORT: "project:import"
    // Placeholder for future
  }
};
const api = {
  windowControls: {
    minimize: () => electron.ipcRenderer.send(IPC_CHANNELS.WINDOW.MINIMIZE),
    maximize: () => electron.ipcRenderer.send(IPC_CHANNELS.WINDOW.MAXIMIZE),
    close: () => electron.ipcRenderer.send(IPC_CHANNELS.WINDOW.CLOSE)
  },
  db: {
    /** 獲取所有專案 */
    getProjects: () => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.GET_PROJECTS),
    /** * 新增專案
     * @param project - 排除自動生成欄位的專案資料
     */
    addProject: (project) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.ADD_PROJECT, project),
    /** 更新專案 */
    updateProject: (project) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.UPDATE_PROJECT, project),
    /** 刪除專案 */
    deleteProject: (id) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.DELETE_PROJECT, id),
    /** 根據專案 ID 獲取路由 */
    getRoutesByProjectId: (projectId) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.GET_ROUTES, projectId),
    /** 新增路由 */
    addRoute: (route) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.ADD_ROUTE, route),
    /** 更新路由 */
    updateRoute: (route) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.UPDATE_ROUTE, route),
    /** 刪除路由 */
    deleteRoute: (id) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.DELETE_ROUTE, id),
    /** 重新排序路由 */
    reorderRoutes: (projectId, routes) => electron.ipcRenderer.invoke(IPC_CHANNELS.DB.REORDER_ROUTES, projectId, routes)
  },
  server: {
    start: (payload) => electron.ipcRenderer.invoke(IPC_CHANNELS.SERVER.START, payload),
    stop: (projectId) => electron.ipcRenderer.invoke(IPC_CHANNELS.SERVER.STOP, projectId)
  },
  project: {
    export: (content, filename) => electron.ipcRenderer.invoke(IPC_CHANNELS.PROJECT.EXPORT, { content, filename }),
    exportHtml: (payload) => electron.ipcRenderer.invoke(IPC_CHANNELS.PROJECT.EXPORT_HTML, payload),
    import: () => electron.ipcRenderer.invoke(IPC_CHANNELS.PROJECT.IMPORT)
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error("[Preload] Failed to expose context bridge:", error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
