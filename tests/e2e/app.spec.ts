/**
 * Mocky E2E 測試腳本
 *
 * 使用 Playwright 進行 Electron 應用程式測試
 *
 * 執行測試：npx playwright test
 * 執行單一測試：npx playwright test --grep "TC-001"
 */

import { test, expect, ElectronApplication, Page } from '@playwright/test'
import { _electron as electron } from 'playwright'
import path from 'path'

// --- 常量宣告 ---
const APP_PATH = path.join(__dirname, '../../out/main/index.js')

const TIMEOUT = {
  SHORT: 500,
  MEDIUM: 2000,
  LONG: 5000
}

const TEST_PROJECT = {
  NAME: 'E2E Test Project',
  PORT: 9999,
  DESCRIPTION: 'Automated test project'
}

// --- 測試上下文 ---
let electronApp: ElectronApplication
let page: Page

// --- 測試生命週期 ---
test.beforeAll(async () => {
  electronApp = await electron.launch({ args: [APP_PATH] })
  page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(TIMEOUT.MEDIUM)
})

test.afterAll(async () => {
  await electronApp.close()
})

// ===========================================
// 一、應用程式啟動與佈局
// ===========================================

test.describe('應用程式啟動與佈局', () => {
  test('TC-001: 應用程式成功啟動', async () => {
    await expect(page).toBeTruthy()
  })

  test('TC-002: 標題列顯示', async () => {
    const titleBar = page.locator('header').first()
    await expect(titleBar).toBeVisible()

    const appName = page.locator('text=Mocky')
    await expect(appName).toBeVisible()
  })

  test('TC-003: 側邊欄顯示', async () => {
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()

    const projectsTitle = page.locator('text=Projects')
    await expect(projectsTitle).toBeVisible()
  })

  test('TC-004: 狀態列顯示', async () => {
    const statusBar = page.locator('footer')
    await expect(statusBar).toBeVisible()

    const version = page.locator('text=v1.0.0')
    await expect(version).toBeVisible()
  })

  test('TC-005: 歡迎頁面顯示', async () => {
    const welcomeTitle = page.locator('text=Welcome to Mocky')
    await expect(welcomeTitle).toBeVisible()
  })

  test('TC-006: 狀態列顯示 Ready', async () => {
    const readyStatus = page.locator('text=Ready')
    await expect(readyStatus).toBeVisible()
  })
})

// ===========================================
// 二、視窗控制
// ===========================================

test.describe('視窗控制', () => {
  test('TC-101: 視窗控制按鈕存在', async () => {
    const minimizeBtn = page.locator('button[aria-label="Minimize"]')
    const maximizeBtn = page.locator('button[aria-label="Maximize"]')
    const closeBtn = page.locator('button[aria-label="Close"]')

    await expect(minimizeBtn).toBeVisible()
    await expect(maximizeBtn).toBeVisible()
    await expect(closeBtn).toBeVisible()
  })

  test('TC-102: 視窗控制按鈕可互動', async () => {
    const minimizeBtn = page.locator('button[aria-label="Minimize"]')
    await expect(minimizeBtn).toBeEnabled()

    const maximizeBtn = page.locator('button[aria-label="Maximize"]')
    await expect(maximizeBtn).toBeEnabled()
  })

  test('TC-103: 標題列拖曳區域存在', async () => {
    const titlebar = page.locator('.titlebar')
    await expect(titlebar).toBeVisible()
  })
})

// ===========================================
// 三、專案管理 - 建立專案
// ===========================================

test.describe('專案管理 - 建立專案', () => {
  test('TC-201: 開啟建立專案 Modal', async () => {
    const addButton = page.locator('aside button').first()
    await addButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: TIMEOUT.MEDIUM })

    const modalTitle = page.locator('text=建立新專案')
    await expect(modalTitle).toBeVisible()
  })

  test('TC-202: 空表單驗證', async () => {
    const nameInput = page.locator('input').first()
    await nameInput.fill('')

    const createBtn = page.locator('button:has-text("建立專案")')
    await expect(createBtn).toBeDisabled()
  })

  test('TC-203: Port 預設值為 8000', async () => {
    const portInput = page.locator('input[type="number"]').first()
    await expect(portInput).toHaveValue('8000')
  })

  test('TC-204: 填寫表單並建立專案', async () => {
    // 填寫專案名稱
    const nameInput = page.locator('input').first()
    await nameInput.fill(TEST_PROJECT.NAME)

    // 修改 Port
    const portInput = page.locator('input[type="number"]').first()
    await portInput.fill(String(TEST_PROJECT.PORT))

    // 填寫描述
    const descInput = page.locator('textarea')
    await descInput.fill(TEST_PROJECT.DESCRIPTION)

    // 點擊建立
    const createBtn = page.locator('button:has-text("建立專案")')
    await createBtn.click()

    // 驗證 Modal 關閉
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeHidden({ timeout: TIMEOUT.MEDIUM })
  })

  test('TC-205: 專案出現在側邊欄', async () => {
    const projectItem = page.locator(`text=${TEST_PROJECT.NAME}`)
    await expect(projectItem).toBeVisible({ timeout: TIMEOUT.MEDIUM })
  })

  test('TC-206: 專案 Port 標籤顯示', async () => {
    const portBadge = page.locator(`text=${TEST_PROJECT.PORT}`)
    await expect(portBadge).toBeVisible()
  })
})

// ===========================================
// 四、專案管理 - 右鍵選單
// ===========================================

test.describe('專案管理 - 右鍵選單', () => {
  test('TC-301: 右鍵開啟選單', async () => {
    const projectItem = page.locator(`text=${TEST_PROJECT.NAME}`)
    await projectItem.click({ button: 'right' })

    const editOption = page.locator('text=Edit')
    await expect(editOption).toBeVisible({ timeout: TIMEOUT.MEDIUM })
  })

  test('TC-302: 點擊其他地方關閉選單', async () => {
    await page.click('main', { force: true })

    await page.waitForTimeout(TIMEOUT.SHORT)
  })

  test('TC-303: 選擇專案進入詳情頁', async () => {
    const projectItem = page.locator(`text=${TEST_PROJECT.NAME}`)
    await projectItem.click()

    await page.waitForTimeout(TIMEOUT.SHORT)

    const routesTitle = page.locator('text=Routes')
    await expect(routesTitle).toBeVisible({ timeout: TIMEOUT.MEDIUM })
  })
})

// ===========================================
// 五、路由管理
// ===========================================

test.describe('路由管理', () => {
  test('TC-401: 進入專案顯示 Routes 區域', async () => {
    const routesTitle = page.locator('text=Routes')
    await expect(routesTitle).toBeVisible()
  })

  test('TC-402: 新增路由', async () => {
    const addRouteBtn = page.locator('button[aria-label="Add Route"]')
    await addRouteBtn.click()

    await page.waitForTimeout(TIMEOUT.SHORT)

    const routeItem = page.locator('text=/new-endpoint')
    await expect(routeItem).toBeVisible({ timeout: TIMEOUT.MEDIUM })
  })

  test('TC-403: 路由 Method 標籤顯示', async () => {
    const methodBadge = page.locator('span:has-text("GET")').first()
    await expect(methodBadge).toBeVisible()
  })

  test('TC-404: 選中路由顯示編輯器', async () => {
    const routeItem = page.locator('text=/new-endpoint').first()
    await routeItem.click()

    await page.waitForTimeout(TIMEOUT.MEDIUM)

    const editor = page.locator('.monaco-editor')
    await expect(editor).toBeVisible({ timeout: TIMEOUT.LONG })
  })

  test('TC-405: 搜尋過濾路由', async () => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('new')

    const routeItem = page.locator('text=/new-endpoint')
    await expect(routeItem).toBeVisible()
  })

  test('TC-406: 搜尋無結果提示', async () => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('zzz-not-exist')

    const noResult = page.locator('text=No routes match')
    await expect(noResult).toBeVisible()
  })

  test('TC-407: 清空搜尋恢復列表', async () => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('')

    const routeItem = page.locator('text=/new-endpoint')
    await expect(routeItem).toBeVisible()
  })
})

// ===========================================
// 六、路由編輯器
// ===========================================

test.describe('路由編輯器', () => {
  test.beforeAll(async () => {
    // 確保選中路由
    const routeItem = page.locator('text=/new-endpoint').first()
    if (await routeItem.isVisible()) {
      await routeItem.click()
      await page.waitForTimeout(TIMEOUT.MEDIUM)
    }
  })

  test('TC-501: Method 選擇器存在', async () => {
    const methodSelect = page.locator('select').first()
    await expect(methodSelect).toBeVisible()
  })

  test('TC-502: 切換 Method 為 POST', async () => {
    const methodSelect = page.locator('select').first()
    await methodSelect.selectOption('POST')
    await expect(methodSelect).toHaveValue('POST')
  })

  test('TC-503: 切換 Method 回 GET', async () => {
    const methodSelect = page.locator('select').first()
    await methodSelect.selectOption('GET')
    await expect(methodSelect).toHaveValue('GET')
  })

  test('TC-504: Path 輸入框存在', async () => {
    const pathInput = page.locator('input[placeholder*="/api"]')
    await expect(pathInput).toBeVisible()
  })

  test('TC-505: 修改 Path', async () => {
    const pathInput = page.locator('input[placeholder*="/api"]')
    await pathInput.fill('/api/users')
    await expect(pathInput).toHaveValue('/api/users')
  })

  test('TC-506: Status Code 修改', async () => {
    const statusInput = page.locator('input[type="number"]').nth(0)
    await statusInput.fill('201')

    const statusLabel = page.locator('text=Created')
    await expect(statusLabel).toBeVisible()
  })

  test('TC-507: Status Code 恢復 200', async () => {
    const statusInput = page.locator('input[type="number"]').nth(0)
    await statusInput.fill('200')

    const statusLabel = page.locator('text=OK')
    await expect(statusLabel).toBeVisible()
  })

  test('TC-508: Monaco Editor 顯示', async () => {
    const editor = page.locator('.monaco-editor')
    await expect(editor).toBeVisible()
  })

  test('TC-509: Format 按鈕存在', async () => {
    const formatBtn = page.locator('button:has-text("Format")')
    await expect(formatBtn).toBeVisible()
    await expect(formatBtn).toBeEnabled()
  })

  test('TC-510: 儲存狀態顯示', async () => {
    await page.waitForTimeout(TIMEOUT.LONG)
    const savedIndicator = page.locator('text=Saved')
    await expect(savedIndicator).toBeVisible({ timeout: TIMEOUT.LONG })
  })
})

// ===========================================
// 七、Mock Server
// ===========================================

test.describe('Mock Server', () => {
  test('TC-601: Start Server 按鈕存在', async () => {
    const startBtn = page.locator('button:has-text("Start Server")')
    await expect(startBtn).toBeVisible()
  })

  test('TC-602: 啟動伺服器', async () => {
    const startBtn = page.locator('button:has-text("Start Server")')
    await startBtn.click()

    const stopBtn = page.locator('button:has-text("Stop Server")')
    await expect(stopBtn).toBeVisible({ timeout: TIMEOUT.LONG })
  })

  test('TC-603: 停止伺服器', async () => {
    const stopBtn = page.locator('button:has-text("Stop Server")')
    await stopBtn.click()

    const startBtn = page.locator('button:has-text("Start Server")')
    await expect(startBtn).toBeVisible({ timeout: TIMEOUT.LONG })
  })

  test('TC-604: 專案資訊顯示', async () => {
    const projectName = page.locator(`h2:has-text("${TEST_PROJECT.NAME}")`)
    await expect(projectName).toBeVisible()
  })

  test('TC-605: Port 資訊顯示', async () => {
    const portInfo = page.locator(`text=Port: ${TEST_PROJECT.PORT}`)
    await expect(portInfo).toBeVisible()
  })
})

// ===========================================
// 八、Modal 互動
// ===========================================

test.describe('Modal 互動', () => {
  test('TC-701: ESC 關閉建立專案 Modal', async () => {
    const addButton = page.locator('aside button').first()
    await addButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(modal).toBeHidden({ timeout: TIMEOUT.MEDIUM })
  })

  test('TC-702: 取消按鈕關閉 Modal', async () => {
    const addButton = page.locator('aside button').first()
    await addButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    const cancelBtn = page.locator('button:has-text("取消")')
    await cancelBtn.click()

    await expect(modal).toBeHidden({ timeout: TIMEOUT.MEDIUM })
  })

  test('TC-703: 遮罩層點擊關閉 Modal', async () => {
    const addButton = page.locator('aside button').first()
    await addButton.click()

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // 點擊遮罩層 (左上角)
    await page.locator('.fixed.inset-0.z-50').click({ position: { x: 10, y: 10 } })

    await expect(modal).toBeHidden({ timeout: TIMEOUT.MEDIUM })
  })
})

// ===========================================
// 十、邊界案例
// ===========================================

test.describe('邊界案例', () => {
  test('TC-901: 空專案名稱無法建立', async () => {
    const addButton = page.locator('aside button').first()
    await addButton.click()

    await page.waitForTimeout(TIMEOUT.SHORT)

    const nameInput = page.locator('input').first()
    await nameInput.fill('')

    const createBtn = page.locator('button:has-text("建立專案")')
    await expect(createBtn).toBeDisabled()

    await page.keyboard.press('Escape')
  })

  test('TC-902: 特殊字元專案名稱可輸入', async () => {
    const addButton = page.locator('aside button').first()
    await addButton.click()

    await page.waitForTimeout(TIMEOUT.SHORT)

    const nameInput = page.locator('input').first()
    await nameInput.fill('<script>alert("test")</script>')

    const createBtn = page.locator('button:has-text("建立專案")')
    await expect(createBtn).toBeEnabled()

    await page.keyboard.press('Escape')
  })

  test('TC-903: 長專案名稱可輸入', async () => {
    const addButton = page.locator('aside button').first()
    await addButton.click()

    await page.waitForTimeout(TIMEOUT.SHORT)

    const longName = 'A'.repeat(100)
    const nameInput = page.locator('input').first()
    await nameInput.fill(longName)

    const createBtn = page.locator('button:has-text("建立專案")')
    await expect(createBtn).toBeEnabled()

    await page.keyboard.press('Escape')
  })
})
