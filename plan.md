這是一份針對 **Mocky** 專案的 **30 階段深度開發藍圖**。這份計劃跳過了環境配置，直接進入 **「實作與產出」** 的環節。

---

### 🏛️ 里程碑 I：應用程式骨架與導航 (Stages 1-5)

**目標**：建立應用程式的視覺框架與視窗控制。

#### Stage 1: 應用程式主佈局 (App Layout)

- **UI 實作**:
- [ ] 建立 `MainLayout.vue`，使用 CSS Grid 或 Flex 劃分 `Sidebar` (左)、`TopBar` (上)、`Content` (中) 區域。
- [ ] 設定 Sidebar 固定寬度 (e.g., 250px)，Content 區域自適應寬度。
- [ ] 設定全域背景色與文字顏色 (Dark/Light theme 基礎)。

- **功能驗證**:
- [ ] 視窗縮放時，Sidebar 寬度固定，Content 區域隨之伸縮。

#### Stage 2: 自定義視窗標題列 (Custom TitleBar)

- **UI 實作**:
- [ ] 隱藏 Electron 原生標題列 (`frame: false`)。
- [ ] 製作 `TitleBar` 組件，包含 App Icon 與標題。
- [ ] 製作視窗控制按鈕組：最小化 (`-`)、最大化/還原 (`□`)、關閉 (`×`)，並套用 Hover 效果。

- **功能驗證**:
- [ ] 只有 TitleBar 區域可以拖曳視窗 (`-webkit-app-region: drag`)。
- [ ] 點擊控制按鈕能正確控制視窗行為。

#### Stage 3: 側邊欄專案列表 UI (Sidebar Project List)

- **UI 實作**:
- [ ] 製作 `ProjectItem` 組件，包含專案名稱與 Port 標籤。
- [ ] 在 Sidebar 實作垂直滾動列表。
- [ ] 實作「選中狀態」樣式 (Highlighed background)。

- **功能驗證**:
- [ ] 使用假資料 (Mock Data) 渲染 5 個專案，確認列表樣式正確。
- [ ] 點擊不同項目，選中樣式會隨之切換。

#### Stage 4: 路由視圖切換 (Router View)

- **UI 實作**:
- [ ] 設定 Vue Router，定義 `/project/:id` 路由。
- [ ] 建立 `WelcomeView.vue` (無專案時顯示) 與 `ProjectDetailView.vue` (專案內容)。

- **功能驗證**:
- [ ] 點擊側邊欄專案時，右側網址列與視圖內容正確變更。
- [ ] 未選取專案時，顯示 Welcome 頁面。

#### Stage 5: 底部狀態列 (Status Bar)

- **UI 實作**:
- [ ] 建立固定於底部的 `StatusBar` 組件。
- [ ] 設計左側：顯示當前服務狀態 (Ready / Running on :8000)。
- [ ] 設計右側：顯示 App 版本號。

- **功能驗證**:
- [ ] 狀態列不隨頁面內容滾動而移動，始終固定在底部。

---

### 📦 里程碑 II：專案管理核心 (Stages 6-10)

**目標**：完成專案 (Project) 的 CRUD 與本地資料庫串接。

#### Stage 6: 資料庫服務封裝 (DB Service)

- **功能實作**:
- [ ] 在 Main Process 封裝 LowDB/Electron-Store 的 `getProjects()` 與 `addProject()` 方法。
- [ ] 在 Preload.js 暴露 `window.api.getProjects` 等介面。

- **功能驗證**:
- [ ] App 啟動時，Console 能印出從本地檔案讀取的空陣列或預設資料。

#### Stage 7: 新增專案模態窗 (Create Project Modal)

- **UI 實作**:
- [ ] 使用 Dialog/Modal 組件製作表單。
- [ ] 欄位：專案名稱 (Input)、Port (Number Input, default 8000)、描述 (Textarea)。
- [ ] 驗證邏輯：專案名稱必填、Port 必須為數字。

- **功能驗證**:
- [ ] 點擊 Sidebar 的「+」按鈕能開啟 Modal。
- [ ] 點擊遮罩層或取消按鈕能關閉 Modal。

#### Stage 8: 專案建立邏輯串接

- **功能實作**:
- [ ] 前端 Pinia Store action: `createProject`。
- [ ] 串接 IPC 發送資料給 Main Process。
- [ ] Main Process 寫入 DB 並回傳新生成的 ID (UUID)。

- **功能驗證**:
- [ ] 填寫表單後送出，Sidebar 列表立即出現新專案。
- [ ] 重啟 App，該專案依然存在。

#### Stage 9: 專案右鍵選單 (Context Menu)

- **UI 實作**:
- [ ] 實作自定義 Context Menu 或使用 Electron 原生 Menu。
- [ ] 選項：編輯 (Edit)、刪除 (Delete)。

- **功能驗證**:
- [ ] 在 Sidebar 項目上點擊右鍵，選單出現在滑鼠位置。
- [ ] 點擊其他地方，選單自動消失。

#### Stage 10: 刪除專案流程

- **功能實作**:
- [ ] 點擊刪除後，跳出「確認刪除」警告視窗 (Alert)。
- [ ] 確認後呼叫 IPC `deleteProject`。
- [ ] 前端 Store 移除該資料，若當前正在瀏覽該專案，自動導回 Welcome 頁。

- **功能驗證**:
- [ ] 刪除後，`db.json` 中的資料確實消失。

---

### 🔗 里程碑 III：API 路由管理 (Stages 11-15)

**目標**：在專案內管理 API 列表。

#### Stage 11: 路由列表佈局 (Route Sidebar)

- **UI 實作**:
- [ ] 在 `ProjectDetailView` 內部實作二級導航 (左側是路由列表，右側是編輯器)。
- [ ] 製作 `RouteItem` 組件，顯示 Method (彩色標籤) 與 Path。

- **功能驗證**:
- [ ] 進入專案頁面，能看到該專案底下的 API 列表區域。

#### Stage 12: 路由資料結構與讀取

- **功能實作**:
- [ ] 定義 Route Interface (method, path, description, response)。
- [ ] 實作 Main Process: `getRoutesByProjectId(id)`。

- **功能驗證**:
- [ ] 切換專案時，列表能正確刷新顯示屬於該專案的 API。

#### Stage 13: 快速新增路由 (Quick Add Route)

- **UI 實作**:
- [ ] 在路由列表上方實作「新增 API」按鈕。
- [ ] 預設建立一個 GET `/new-endpoint` 的暫存資料。

- **功能驗證**:
- [ ] 點擊新增，列表立即多出一項，並自動選中該項進入編輯模式。

#### Stage 14: 路由過濾搜尋 (Route Filter)

- **UI 實作**:
- [ ] 在列表上方加入搜尋框。

- **功能實作**:
- [ ] 實作前端過濾邏輯 (Computed property)，比對 Path 或 Description。

- **功能驗證**:
- [ ] 輸入關鍵字，列表即時過濾顯示符合的項目。

#### Stage 15: 路由刪除功能

- **UI 實作**:
- [ ] 在 `RouteItem` 上增加刪除圖示 (Hover 時顯示)。

- **功能驗證**:
- [ ] 點擊刪除，API 從列表中移除，且 DB 同步更新。

---

### 📝 里程碑 IV：API 編輯器 - 基礎資訊 (Stages 16-20)

**目標**：編輯 API 的 Method 與 Path。

#### Stage 16: 編輯器頭部區塊 (Editor Header)

- **UI 實作**:
- [ ] 建立 `RouteEditor` 組件。
- [ ] 佈局上方輸入區：Method Select + Path Input。

- **功能驗證**:
- [ ] 點擊不同的路由列表項目，編輯器頭部資料正確連動更新。

#### Stage 17: HTTP Method 選擇器

- **UI 實作**:
- [ ] 製作下拉選單，包含 GET (藍), POST (黃), PUT (橙), DELETE (紅), PATCH (綠)。
- [ ] 選擇後，按鈕顏色隨之變化。

- **功能驗證**:
- [ ] 切換 Method，資料變更寫入 Store (尚未持久化)。

#### Stage 18: 路徑輸入與參數高亮

- **UI 實作**:
- [ ] Path 輸入框。

- **功能實作**:
- [ ] 簡單的正則驗證：確保以 `/` 開頭。
- [ ] (進階) 偵測 `:id` 格式，給予特殊顏色樣式 (可選)。

- **功能驗證**:
- [ ] 輸入 `users` 自動修正為 `/users` (Blur 事件)。

#### Stage 19: API 描述與 metadata

- **UI 實作**:
- [ ] 在路徑下方增加「描述」輸入框。
- [ ] 增加「啟用/停用」此路由的 Toggle Switch。

- **功能驗證**:
- [ ] 關閉 Toggle，該路由在列表中變灰 (Dimmed)。

#### Stage 20: 編輯器自動儲存/手動儲存

- **功能實作**:
- [ ] 實作 `Ctrl+S` (Cmd+S) 監聽。
- [ ] 實作 Debounce (防抖) 自動儲存機制 (例如停止輸入後 1秒自動存)。
- [ ] 右下角顯示「已儲存」或「未儲存」狀態。

- **功能驗證**:
- [ ] 修改資料後，觀察 DB 檔案確實被寫入更新。

---

### 💻 里程碑 V：API 編輯器 - 回應內容 (Stages 21-25)

**目標**：編輯 JSON 回應與狀態碼。

#### Stage 21: 狀態碼選擇器

- **UI 實作**:
- [ ] 製作 Status Code 下拉選單 (200 OK, 201 Created, 400 Bad Request, 500 Error)。
- [ ] 支援手動輸入自訂代碼。

- **功能驗證**:
- [ ] 選擇 404，儲存後重開 App，狀態碼維持 404。

#### Stage 22: Monaco Editor 整合 (核心)

- **UI 實作**:
- [ ] 安裝並整合 `@guolao/vue-monaco-editor`。
- [ ] 設定語言為 JSON，Theme 為 VS Dark。

- **功能驗證**:
- [ ] 編輯器能正常顯示，且具備 VS Code 風格的代碼高亮。

#### Stage 23: JSON 格式驗證與錯誤提示

- **功能實作**:
- [ ] 監聽 Editor 內容變更。
- [ ] 使用 `JSON.parse` 嘗試解析，若失敗則顯示錯誤訊息條 (Error Bar)。

- **功能驗證**:
- [ ] 輸入 `{ key: "value"` (少括號)，介面提示「Invalid JSON」。
- [ ] 修正後錯誤消失。

#### Stage 24: 延遲設定 (Latency)

- **UI 實作**:
- [ ] 增加「回應延遲 (ms)」的數字輸入框。
- [ ] 提供預設選項：0ms, 500ms, 2000ms。

- **功能驗證**:
- [ ] 設定值能正確綁定到資料模型。

#### Stage 25: 格式化代碼功能 (Prettify)

- **UI 實作**:
- [ ] 在編輯器右上角加入「Format JSON」小按鈕。

- **功能實作**:
- [ ] 點擊後呼叫 `JSON.stringify(obj, null, 2)` 重新排版內容。

- **功能驗證**:
- [ ] 輸入壓縮的一行 JSON，點擊後自動展開為漂亮的縮排格式。

---

### 🚀 里程碑 VI：Mock Server 引擎與交付 (Stages 26-30)

**目標**：讓 Server 真正跑起來，並處理回應。

#### Stage 26: Fastify 伺服器基礎 (Main Process)

- **功能實作**:
- [ ] 在 Main Process 引入 Fastify。
- [ ] 實作 `server:start` IPC，接收 Port 與路由表。
- [ ] 實作 `server:stop` IPC。

- **功能驗證**:
- [ ] 點擊前端 Start，後端 Console 顯示 "Server listening on port 8000"。

#### Stage 27: 動態路由掛載 (Dynamic Mounting)

- **功能實作**:
- [ ] 遍歷路由表，使用 `server.route()` 動態註冊 API。
- [ ] 處理 HTTP Method 與 Path 的對應。

- **功能驗證**:
- [ ] 使用 Postman 呼叫 `GET http://localhost:8000/users`，能收到編輯器中的 JSON。

#### Stage 28: 智慧 Port 管理與狀態回饋

- **功能實作**:
- [x] 若 Port 被佔用，自動嘗試 Port + 1。
- [x] 將最終實際運行的 Port 回傳給前端。

- **功能驗證**:
- [x] 開啟兩個 Mocky 專案設定相同 Port，第二個專案自動運行在 8001。

#### Stage 29: 熱更新 (Hot Reload) 策略

- **功能實作**:
- [ ] 當路由資料變更時，觸發 `server:restart` (簡單版) 或動態更新路由 (進階版)。

- **功能驗證**:
- [ ] 服務運行中，修改 JSON 回應並儲存，Postman 再次請求立即得到新內容。

#### Stage 30: 打包與發布驗證

- **功能實作**:
- [ ] 配置 `electron-builder` (Icon, AppId, Compression)。
- [ ] 執行 `npm run build`。
