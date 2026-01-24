// --- 1. 外部引用 (Imports) ---
import { app, shell, BrowserWindow, ipcMain, WebContents } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 內部資源
import { dbService } from './db'

// --- 3. 常量宣告 (Constants) ---
const APP_USER_MODEL_ID = 'com.electron.app' // TODO: 正式發布時應替換為具體的 Bundle ID

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
    ADD_ROUTE: 'db:addRoute'
  }
} as const // 使用 const assertion 確保字串不可變

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
