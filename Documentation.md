# Mocky 使用說明文件 (User Documentation)

## 📖 簡介 (Introduction)

**Mocky** 是一個專為開發者設計的桌面應用程式，旨在透過直觀的圖形化介面 (GUI) 輕鬆建立與管理 Mock API 服務。它解決了前端與後端開發過程中需要快速建立 API 原型的痛點，讓您無需手動編寫繁瑣的伺服器代碼，即可專注於核心業務邏輯的開發。

**Mocky** is a desktop application designed for developers to easily create and manage Mock API services through an intuitive Graphical User Interface (GUI). It addresses the need for quick API prototyping during frontend and backend development, allowing you to focus on core business logic without manually writing server code.

---

## 🚀 核心功能 (Core Features)

### 1. 圖形化 API 編輯器 (Graphical API Editor)

- **視覺化操作**：無需寫程式碼，透過介面即可定義 API 路由。
- **完整 HTTP 支援**：支援 GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD 等方法。
- **動態參數**：支援如 `/users/:id` 的動態路由參數。
- **回應控制**：可自訂 HTTP 狀態碼 (200, 404, 500 等) 與模擬網路延遲 (Delay)。
- **專業編輯器**：內建 Monaco Editor，提供 JSON 格式化與驗證功能。

**English:**

- **Visual Operation**: Define API routes without coding.
- **Full HTTP Support**: Supports GET, POST, etc.
- **Dynamic Parameters**: Supports dynamic route parameters like `/users/:id`.
- **Response Control**: Customize HTTP status codes and simulate network latency (Delay).
- **Professional Editor**: Built-in Monaco Editor for JSON formatting and validation.

### 2. 本地 Mock 伺服器 (Local Mock Server)

- **一鍵啟動**：基於 Fastify 的高效能伺服器，點擊即用。
- **熱重載 (Hot Reload)**：修改 API 設定後立即生效，無需重啟伺服器。
- **智慧 Port 管理**：自動偵測並避開已被佔用的連接埠。
- **Swagger UI**：伺服器啟動後，可透過 `/docs` 路徑查看即時生成的 API 文件。

**English:**

- **One-Click Start**: High-performance Fastify-based server.
- **Hot Reload**: Changes apply immediately without restarting.
- **Smart Port Management**: Automatically detects and avoids occupied ports.
- **Swagger UI**: Access auto-generated API docs at `/docs`.

### 3. 匯入與匯出 (Import & Export)

- **OpenAPI 匯入**：支援匯入 OpenAPI v3 (JSON) 格式，快速遷移現有專案。
- **多樣化匯出**：可匯出為標準 OpenAPI JSON 檔案，或基於 Redoc 的靜態 HTML 文件，方便團隊分享。

**English:**

- **OpenAPI Import**: Import existing OpenAPI v3 (JSON) projects.
- **Versatile Export**: Export as standard OpenAPI JSON or Redoc-based static HTML.

---

## 🛠️ 操作說明 (Operation Guide)

### 1. 建立新專案 (Creating a Project)

1. 開啟 Mocky 應用程式。
2. 點擊左側列表上方的 **"+" (新增專案)** 按鈕。
3. 輸入 **專案名稱** (如 "E-commerce API") 與 **基礎 Port** (預設 8000)。
4. 點擊 **Create** 完成建立。

**English:**

1. Open Mocky.
2. Click the **"+" (New Project)** button above the left sidebar.
3. Enter **Project Name** and **Base Port** (def. 8000).
4. Click **Create**.

### 2. 新增與編輯 API (Manage APIs)

1. 選擇左側的專案。
2. 點擊主畫面中的 **"New Route"** 或 **"+"** 按鈕。
3. **設定路由資訊**：
   - 選擇 **Method** (例如 GET)。
   - 輸入 **Path** (例如 `/products`)。
   - (選填) 加入 **Tags** 進行分類。
4. **設定回應內容 (Response)**：
   - 在編輯器中輸入預期的 JSON 回傳資料。
   - 若需模擬錯誤，可調整 **Status** (例如 400)。
   - 若需模擬慢速網路，可調整 **Delay** (毫秒)。
5. 設定完成後自動儲存。

**English:**

1. Select a project.
2. Click **"New Route"** or **"+"**.
3. **Configure Route**: Set Method (e.g., GET) and Path (e.g., `/products`). Add Tags (optional).
4. **Configure Response**: Enter JSON body, set **Status** code, and adjust **Delay** if needed.
5. Changes are saved automatically.

### 3. 啟動伺服器 (Start Server)

1. 在專案畫面的右上角，找到 **"Start Server"** 按鈕。
2. 點擊後按鈕變為綠色，並顯示運作中的 Port (例如 `:8000`)。
3. 您可以點擊 **"Docs"** 圖示直接開啟瀏覽器查看 Swagger UI 文件。
4. 此時您的 API 已可通過 `http://localhost:8000/products` 存取。

**English:**

1. Click the **"Start Server"** button at the top right.
2. The button turns green, showing the active Port.
3. Click the **"Docs"** icon to open Swagger UI.
4. Your API is now accessible (e.g., `http://localhost:8000/products`).

### 4. 匯入與匯出 (Import / Export)

- **匯入 (Import)**：
  - 在專案列表或設定選單中選擇 **Import OpenAPI**。
  - 選擇您的 `.json` 檔案，系統將自動解析並建立對應路由。
- **匯出 (Export)**：
  - 點擊專案設定或匯出按鈕。
  - 選擇 **Export JSON** 取得 OpenAPI 規格檔。
  - 選擇 **Export HTML** 取得美觀的 Redoc 文件網頁。

**English:**

- **Import**: Select **Import OpenAPI**, choose your `.json` file to auto-generate routes.
- **Export**: Choose **Export JSON** for specs or **Export HTML** for Redoc documentation.

---

## ❓ 常見問題 (FAQ)

**Q: 為什麼我的 Port 被改了？ (Why did my port change?)**
A: 如果您設定的 Port (例如 8000) 已經被其他應用程式佔用，Mocky 會自動嘗試下一個可用的 Port (例如 8001) 以確保伺服器能順利啟動。
_(Mocky automatically increments the port if the selected one is in use.)_

**Q: 支援 HTTPS 嗎？ (Is HTTPS supported?)**
A: 目前 Mocky 主要設計為本地開發使用，預設提供 HTTP 服務。如需 HTTPS，建議透過反向代理 (如 Nginx) 或在正式環境部署匯出的定義檔。
_(Mocky defaults to HTTP for local dev. Use a reverse proxy for HTTPS if needed.)_

---

## 📞 支援與回饋 (Support)

如果您在使用過程中遇到任何問題，或有功能建議，歡迎聯繫開發團隊或提交 Issue。
For issues or suggestions, please contact the development team.

**Happy Mocking!**
