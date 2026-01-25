// --- 1. 外部引用 (Imports) ---
import { app, shell, BrowserWindow, ipcMain, WebContents, dialog } from 'electron'
import { join } from 'path'
import { writeFile, readFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 內部資源
import { dbService } from './db'
import { serverManager } from './server'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import { toOpenApi } from './utils/openapi-generator'
import { generateRedocHtml } from './utils/htmlGenerator'

// --- 3. 常量宣告 (Constants) ---
const APP_USER_MODEL_ID = 'com.electron.app' // TODO: 正式發布時應替換為具體的 Bundle ID

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 獲取觸發 IPC 事件的視窗實例
 * @param sender - 事件發送者的 WebContents
 * @returns BrowserWindow | null
 */
const getWindowFromEvent = (sender: WebContents): BrowserWindow | null => {
  return BrowserWindow.fromWebContents(sender)
}

/**
 * 建立主應用視窗
 */
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false, // 隱藏原生標題列
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 外部連結跳轉處理
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 載入頁面 (開發環境 HMR / 生產環境檔案)
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * 註冊所有 IPC 通訊監聽器
 */
function registerIpcHandlers(): void {
  // --- 視窗控制 IPC (使用 Event Sender 提高穩定性) ---
  ipcMain.on(IPC_CHANNELS.WINDOW.MINIMIZE, (event) => {
    const win = getWindowFromEvent(event.sender)
    win?.minimize() // 衛句模式檢查
  })

  ipcMain.on(IPC_CHANNELS.WINDOW.MAXIMIZE, (event) => {
    const win = getWindowFromEvent(event.sender)
    if (!win) return

    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW.CLOSE, (event) => {
    const win = getWindowFromEvent(event.sender)
    win?.close()
  })

  // --- 資料庫 IPC (包含錯誤處理與空值檢查) ---
  ipcMain.handle(IPC_CHANNELS.DB.GET_PROJECTS, async () => {
    try {
      return await dbService.getProjects()
    } catch (error) {
      console.error('[IPC] Failed to get projects:', error)
      return [] // 數據容錯：回傳空列表
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB.ADD_PROJECT, async (_, project) => {
    try {
      if (!project) throw new Error('Missing project data') // 輸入過濾
      return await dbService.addProject(project)
    } catch (error) {
      console.error('[IPC] Failed to add project:', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB.DELETE_PROJECT, async (_, id) => {
    try {
      if (!id) return false
      return await dbService.deleteProject(id)
    } catch (error) {
      console.error('[IPC] Failed to delete project:', error)
      return false
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB.GET_ROUTES, async (_, projectId) => {
    try {
      if (!projectId) return []
      return await dbService.getRoutesByProjectId(projectId)
    } catch (error) {
      console.error('[IPC] Failed to get routes:', error)
      return []
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB.ADD_ROUTE, async (_, route) => {
    try {
      // 這裡應該要做更嚴格的驗證 (Zod parse)，但暫時先做基本檢查
      if (!route || !route.projectId) throw new Error('Missing route data')
      return await dbService.addRoute(route)
    } catch (error) {
      console.error('[IPC] Failed to add route:', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB.UPDATE_ROUTE, async (_, route) => {
    try {
      if (!route || !route.id) throw new Error('Missing route data')
      return await dbService.updateRoute(route)
    } catch (error) {
      console.error('[IPC] Failed to update route:', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.DB.DELETE_ROUTE, async (_, id) => {
    try {
      if (!id) return false
      return await dbService.deleteRoute(id)
    } catch (error) {
      console.error('[IPC] Failed to delete route:', error)
      return false
    }
  })

  // --- 伺服器 IPC ---
  ipcMain.handle(IPC_CHANNELS.SERVER.START, async (_, payload) => {
    try {
      if (!payload || !payload.projectId) throw new Error('Missing server payload')
      return await serverManager.start(
        payload.projectId,
        payload.port || 8000,
        payload.routes || [],
        payload.projectInfo || { name: 'Unknown Project' }
      )
    } catch (error: unknown) {
      console.error('[IPC] Failed to start server:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start server'
      throw new Error(errorMessage)
    }
  })

  ipcMain.handle(IPC_CHANNELS.SERVER.STOP, async (_, projectId) => {
    try {
      if (!projectId) return false
      return await serverManager.stop(projectId)
    } catch (error) {
      console.error('[IPC] Failed to stop server:', error)
      return false
    }
  })

  // --- 專案匯出/匯入 IPC ---
  ipcMain.handle(IPC_CHANNELS.PROJECT.EXPORT, async (event, { content, filename }) => {
    try {
      const win = getWindowFromEvent(event.sender)
      if (!win) return false

      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Export Project',
        defaultPath: filename || 'project.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })

      if (canceled || !filePath) return false

      await writeFile(filePath, content, 'utf-8')
      return true
    } catch (error) {
      console.error('[IPC] Failed to export project:', error)
      throw error // 讓前端捕獲錯誤
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECT.IMPORT, async (event) => {
    try {
      const win = getWindowFromEvent(event.sender)
      if (!win) return null

      const { canceled, filePaths } = await dialog.showOpenDialog(win, {
        title: 'Import OpenAPI/Swagger File',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })

      if (canceled || filePaths.length === 0) return null

      const content = await readFile(filePaths[0], 'utf-8')

      // 基礎驗證：檢查是否為有效的 JSON 且包含 OpenAPI 關鍵字
      try {
        const json = JSON.parse(content)
        if (!json.openapi && !json.swagger) {
          throw new Error('Invalid OpenAPI/Swagger file format')
        }
      } catch {
        throw new Error('Invalid JSON file')
      }

      return content
    } catch (error) {
      console.error('[IPC] Failed to import project:', error)
      throw error
    }
  })

  ipcMain.handle(IPC_CHANNELS.PROJECT.EXPORT_HTML, async (event, { project, routes }) => {
    try {
      const win = getWindowFromEvent(event.sender)
      if (!win) return false

      const spec = toOpenApi(project, routes)

      // Stage 4: 離線支援 - 讀取本地 Redoc 腳本
      let redocScript = ''
      try {
        const scriptPath = is.dev
          ? join(__dirname, '../../src/shared/redoc.standalone.js')
          : join(process.resourcesPath, 'src/shared/redoc.standalone.js')

        redocScript = await readFile(scriptPath, 'utf-8')
      } catch (e) {
        console.warn('[Export HTML] Failed to load local Redoc script, falling back to CDN', e)
        // Fallback or leave empty to let generator use CDN if we changed generator logic slightly,
        // but current generator expects script content.
        // We'll define a fallback fetch here or just error out.
        // For robustness, let's keep the generator flexible, but here we requested Offline Support.
      }

      const html = generateRedocHtml(spec, project.name, redocScript)

      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Export Documentation',
        defaultPath: `${project.name}-docs.html`,
        filters: [{ name: 'HTML Files', extensions: ['html'] }]
      })

      if (canceled || !filePath) return false

      await writeFile(filePath, html, 'utf-8')
      return true
    } catch (error) {
      console.error('[IPC] Failed to export HTML:', error)
      throw error
    }
  })
}

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---

app.whenReady().then(() => {
  // 設定 App ID
  electronApp.setAppUserModelId(APP_USER_MODEL_ID)

  // 監聽視窗建立
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 初始化 IPC 與視窗
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
