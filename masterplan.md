# Mocky - 開發藍圖 (Masterplan)

## 應用程式概述

**應用程式名稱**: Mocky
**目標**: 建立一個桌面應用程式，讓開發者能透過圖形介面輕鬆建立和管理 Mock API 服務
**當前狀態**: ✅ 1.0.0 正式版已發布

### 核心價值

解決開發者在前端開發過程中需要快速建立 Mock API 的痛點，提供直觀的圖形化介面來替代手動編寫 API 程式碼。

## 目標使用者

### 主要使用者

- **前端開發者**: 需要 Mock API 來進行介面開發和測試
- **後端開發者**: 需要快速原型化 API 或提供臨時測試服務

### 次要使用者

- **專案經理 (PM)**: 查看 API 文檔和規格

## 核心功能與特性 (Features)

### 1. 圖形化 API 編輯器

- ✅ **分頁管理**: 使用分頁來組織不同的 API 群組
- ✅ **群組分類**: 支援自訂 Tags 進行路由分組與過濾
- ✅ **API 基本資訊設定**:
  - HTTP Method 選擇 (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
  - API 路徑定義 (支援動態參數如 `/users/:id`)
  - API 描述文字
  - 路由啟用/停用開關 (Toggle Active/Inactive)
- ✅ **回應設定**:
  - HTTP 狀態碼選擇 (自訂任意代碼)
  - 模擬延遲 (Response Delay)
  - **Monaco Editor**: 提供專業級 JSON 編輯體驗 (格式化、驗證)

### 2. 專案資訊管理

- ✅ **API 專案設定**:
  - 專案標題、說明、版本
  - 服務 Port 設定 (預設 8000)

### 3. 檔案匯入/匯出功能

- ✅ **匯入**: 支援 OpenAPI v3 JSON 格式匯入，自動轉換為專案路由
- ✅ **匯出**:
  - OpenAPI JSON 檔案 (標準格式)
  - 靜態文檔網頁 (基於 Redoc 生成的單一 HTML 檔)

### 4. 本地服務器管理

- ✅ **啟動服務**: 基於 Fastify 的高效能 Mock Server
- ✅ **智慧 Port 管理**: 自動檢測並避開佔用 Port (Auto-increment)
- ✅ **熱重載 (Hot Reload)**: 修改路由或回應後立即生效，無需手動重啟
- ✅ **API 文檔**: 內建 Swagger UI (`/docs`) 供即時測試

## 技術架構 (Stack)

### 包管理

- **工具**: pnpm (Monorepo Workspace)

### 前端技術棧 (Renderer)

- **核心框架**: Vue.js 3 (Script Setup)
- **狀態管理**: Pinia (Single Source of Truth)
- **路由管理**: Vue Router
- **UI 框架**: Tailwind CSS 4 (Utility-first)
- **編輯器核心**: Monaco Editor (via @guolao/vue-monaco-editor)
- **圖示庫**: Lucide-vue-next
- **國際化**: Vue I18n

### 後端服務與邏輯 (Main)

- **Mock 伺服器核心**: Fastify (Node.js)
- **動態路由匹配**: path-to-regexp
- **跨進程通訊**: Electron IPC
- **其它工具**:
  - `fs/promises` (檔案操作)
  - `htmlGenerator` (Redoc 生成)

### 資料儲存

- **資料庫**: LowDB (本地 JSON 檔案 `db.json`)
- **Schema 驗證**: Zod (Runtime Type Checking)

### 跨平台支援

- **核心**: Electron
- **打包工具**: Electron Builder (支援 NSIS Installer, Portable)
- **平台**: Windows, macOS, Linux

## 安全考量 (Security)

### 資料安全

- ✅ **本地優先**: 資料完全存放於使用者本機 (`userData` 目錄)
- ✅ **權限控管**: 僅申請必要的檔案讀寫權限

### 服務安全

- ✅ **Localhost Only**: Mock Server 強制監聽 `127.0.0.1`，防止區網外洩風險
- ✅ **Port 隔離**: 智慧 Port 選擇避免服務衝突

## 開發規範與品質 (Guidelines)

- **代碼風格**: ESLint + Prettier
- **架構原則**: Logic/View 分離 (Composables 優先)
- **型別安全**: 全面採取 TypeScript

## 結論

Mocky 將為開發者提供一個高效、直觀的工具，大幅簡化 Mock API 的建立和管理流程。透過圖形化介面和自動化的服務管理，開發者可以專注於前端開發而不必花費時間在 API 搭建上。

這個工具不僅解決了個人開發效率問題，也為團隊協作提供了標準化的 API 文檔和測試環境，具有很強的實用價值和市場潛力。
