<p align="center">
  <img src="resources/icon.png" alt="Mocky Logo" width="120" height="120">
</p>

<h1 align="center">Mocky</h1>

<p align="center">
  <strong>輕鬆建立與管理 Mock API 的桌面應用程式</strong>
</p>

<p align="center">
  <a href="#功能特色">功能特色</a> •
  <a href="#快速開始">快速開始</a> •
  <a href="#使用指南">使用指南</a> •
  <a href="#技術架構">技術架構</a> •
  <a href="#開發指南">開發指南</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
  <img src="https://img.shields.io/badge/Version-1.0.0-green" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

## 📖 簡介

**Mocky** 是一款專為前端開發者設計的桌面應用程式，讓您透過直觀的圖形介面快速建立和管理 Mock API 服務。無需編寫任何後端程式碼，只需點擊幾下即可創建完整的 API 模擬環境。支援 OpenAPI 匯入與文件生成，是前後端分離開發的最佳助手。

### 為什麼選擇 Mocky？

- 🚀 **零配置啟動** - 無需複雜設定，開箱即用
- 🎨 **視覺化編輯** - 直觀的 UI 介面，所見即所得
- ⚡ **即時生效 (Hot Reload)** - 修改路由或回應後立即反映，無需手動重啟
- 🔄 **OpenAPI 整合** - 支援 Swagger/OpenAPI 規格匯入
- 📄 **文件自動化** - 一鍵生成精美的 API 文件 (Redoc)
- 💾 **本地儲存** - 資料安全存放在您的電腦中
- 🌐 **跨平台支援** - Windows、macOS、Linux 全支援

---

## ✨ 功能特色

### 🗂️ 專案管理

- **多專案管理**: 建立多個獨立的 API 專案，隔離不同環境設定
- **自訂埠口**: 為每個專案設定獨立的服務 Port (預設 8000)
- **智慧埠口偵測**: 若指定 Port 被佔用，自動尋找可用 Port，避免啟動失敗
- **專案描述**: 完整的專案描述與版本管理

### 🔗 路由編輯器

- **全方法支援**: 支援 GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- **動態路由**: 支援 Express 風格的路徑參數 (如 `/users/:id`)
- **狀態控制**: 可個別啟用/停用特定路由
- **群組分類**: 支援 API Tagging，方便組織與管理
- **即時搜尋**: 快速過濾與搜尋路由

### 📝 回應設定

- **專業編輯器**: 整合 **Monaco Editor**，提供 VS Code 等級的 JSON 編輯體驗
- **狀態碼模擬**: 自訂 HTTP Status Code (200, 404, 500 等)
- **延遲模擬**: 設定 Response Delay (Latency) 以測試前端 Loading 狀態
- **格式工具**: 內建 JSON 格式驗證與一鍵美化

### 📥 匯入與匯出

- **OpenAPI 匯入**: 支援匯入標準 OpenAPI (Swagger) v3 JSON 檔案，快速建立專案
- **HTML 文件匯出**: 將專案匯出為單一靜態 HTML 文件 (基於 Redoc)，方便分享與檢閱

### 🖥️ Mock Server

- **一鍵啟動**: 每個專案擁有獨立的 Server 實例
- **Swagger UI**: 內建 Swagger UI (`/docs`)，提供即時 API 測試介面
- **安全性**: 僅監聽 `127.0.0.1` (Localhost)，確保開發環境安全

---

## 📚 使用指南

### 1. 建立專案

1. 點擊側邊欄的 **+** 按鈕
2. 輸入專案名稱和服務 Port (預設 8000)
3. 點擊「建立專案」

### 2. 新增 API 路由

1. 選擇專案後，點擊 Routes 區域的 **+** 按鈕
2. 設定 HTTP 方法 (GET, POST 等)
3. 輸入 API 路徑 (如 `/api/users`)
4. 在編輯器中編寫 JSON 回應內容

### 3. 匯入 OpenAPI

1. 在專案列表頁點擊「Import」按鈕
2. 貼上 OpenAPI v3 JSON 內容
3. 系統將自動解析並建立包含所有路由的新專案

### 4. 啟動 Mock Server

1. 點擊右上角「**Start Server**」按鈕
2. 服務將在指定 Port 啟動 (若佔用則自動遞增)
3. 可點擊連結開啟 Swagger UI (`/docs`) 或直接測試 API

---

## 🏗️ 技術架構

### 前端 (Renderer Process)

| 技術               | 用途                                     |
| ------------------ | ---------------------------------------- |
| **Vue 3**          | 核心框架 (Composition API, Script Setup) |
| **Pinia**          | 狀態管理 (Store)                         |
| **Vue Router**     | 頁面路由管理                             |
| **Tailwind CSS 4** | 現代化 Utility-first CSS 框架            |
| **Monaco Editor**  | 專業程式碼編輯器核心                     |
| **Lucide Icons**   | 輕量質感圖標庫                           |

### 後端 (Main Process)

| 技術                | 用途                                            |
| ------------------- | ----------------------------------------------- |
| **Electron**        | 跨平台桌面應用程式框架                          |
| **Fastify**         | 高效能 Node.js Web Framework (Mock Server 核心) |
| **LowDB**           | 輕量級本地 JSON 資料庫                          |
| **Zod**             | TypeScript Schema 驗證與型別推導                |
| **Bypass Security** | 僅監聽 Localhost 確保安全                       |

### 開發與測試工具

| 工具                  | 用途                        |
| --------------------- | --------------------------- |
| **TypeScript**        | 全專案靜態型別檢查          |
| **Electron-Vite**     | 極速建置與熱更新 (HMR) 工具 |
| **ESLint + Prettier** | 程式碼品質與風格規範        |
| **Playwright**        | 端對端 (E2E) 自動化測試     |

---

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 此專案
2. 建立特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 [MIT License](LICENSE) 授權。

---

## 🙏 致謝

- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [Fastify](https://www.fastify.io/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Redoc](https://redocly.com/redoc/)

---

<p align="center">
  Made with ❤️ by TJ Wang
</p>
