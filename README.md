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

**Mocky** 是一款專為前端開發者設計的桌面應用程式，讓您透過直觀的圖形介面快速建立和管理 Mock API 服務。無需編寫任何後端程式碼，只需點擊幾下即可創建完整的 API 模擬環境。

### 為什麼選擇 Mocky？

- 🚀 **零配置啟動** - 無需複雜設定，開箱即用
- 🎨 **視覺化編輯** - 直觀的 UI 介面，所見即所得
- ⚡ **即時生效** - 修改後立即反映，無需重啟服務
- 💾 **本地儲存** - 資料安全存放在您的電腦中
- 🌐 **跨平台支援** - Windows、macOS、Linux 全支援

---

## ✨ 功能特色

### 🗂️ 專案管理

- 建立多個獨立的 API 專案
- 為每個專案設定獨立的服務 Port
- 專案描述與組織管理

### 🔗 路由編輯器

- 支援所有 HTTP 方法 (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- 動態路徑參數支援 (如 `/users/:id`)
- 路由啟用/停用開關
- 即時搜尋過濾

### 📝 回應設定

- **Monaco Editor** - VS Code 等級的 JSON 編輯體驗
- 自訂 HTTP 狀態碼
- 回應延遲模擬 (Latency)
- JSON 格式驗證與一鍵美化

### 🖥️ Mock Server

- 一鍵啟動/停止服務
- 自動儲存與防抖機制
- 清晰的運行狀態指示

---

## 🚀 快速開始

### 系統需求

- **Node.js** >= 18.x
- **pnpm** >= 8.x (推薦) 或 npm

### 安裝

```bash
# 克隆專案
git clone https://github.com/your-username/mocky.git
cd mocky

# 安裝依賴
pnpm install
```

### 開發模式

```bash
pnpm dev
```

### 建置發行版

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

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

### 3. 啟動 Mock Server

1. 點擊「**Start Server**」按鈕
2. 服務將在指定 Port 啟動
3. 使用瀏覽器或 Postman 訪問 `http://localhost:PORT/your-path`

### 4. 測試 API

```bash
# 使用 curl 測試
curl http://localhost:8000/api/users

# 使用 curl 測試 POST
curl -X POST http://localhost:8000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
```

---

## 🏗️ 技術架構

### 前端 (Renderer Process)

| 技術               | 用途                       |
| ------------------ | -------------------------- |
| **Vue 3**          | 核心框架 (Composition API) |
| **Pinia**          | 狀態管理                   |
| **Vue Router**     | 路由管理                   |
| **Tailwind CSS 4** | 樣式框架                   |
| **Monaco Editor**  | JSON 編輯器                |
| **Lucide Icons**   | 圖標庫                     |

### 後端 (Main Process)

| 技術         | 用途             |
| ------------ | ---------------- |
| **Electron** | 跨平台桌面框架   |
| **Fastify**  | Mock HTTP 伺服器 |
| **LowDB**    | JSON 檔案資料庫  |
| **Zod**      | Schema 驗證      |

### 開發工具

| 工具                  | 用途       |
| --------------------- | ---------- |
| **TypeScript**        | 類型安全   |
| **electron-vite**     | 建置工具   |
| **ESLint + Prettier** | 程式碼風格 |
| **Playwright**        | E2E 測試   |

---

## 🛠️ 開發指南

### 常用指令

```bash
# 開發模式
pnpm dev

# 類型檢查
pnpm typecheck

# 程式碼檢查
pnpm lint

# 格式化程式碼
pnpm format

# 執行 E2E 測試
npx playwright test

# 建置生產版本
pnpm build
```

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

---

<p align="center">
  Made with ❤️ by Mocky Team
</p>
