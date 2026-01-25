這是一份專為 **「Swagger UI 自動化文件整合」** 設計的 5 階段開發計劃。

這個功能的目標是：當使用者按下「啟動服務」時，Mocky 不僅會啟動 API Server，還會自動在 `/docs` 路徑掛載一個與當前設定同步的 Swagger 網頁。

---

### 📑 Swagger UI 整合開發計劃 (5 Stages)

#### Stage 1: OpenAPI 資料轉換引擎 (Data Transformation) ✅ COMPLETED

**目標**：建立核心邏輯，將 Mocky 的內部資料結構 (Project/Routes) 即時轉換為符合 OpenAPI 3.0 規範的 JSON 物件。這是 Swagger UI 能否正確顯示的關鍵。

- **功能實作**:
- [ ] 確認是否已安裝 `openapi-types` 以獲得 TypeScript 支援。
- [ ] 實作/優化 `toOpenApi(project: Project): OpenAPIV3.Document` 函數：
- [ ] **Info Object**: 映射專案名稱、描述、版本號。
- [ ] **Paths Object**: 遍歷所有路由，將動態參數 `/users/:id` 轉換為 OpenAPI 格式 `/users/{id}`。
- [ ] **Methods**: 對應 GET, POST, PUT, DELETE 等方法。
- [ ] **Responses**: 將 Mocky 的 JSON 回應 body 放入 `content['application/json'].example` 中。

- [ ] **Parameter Parsing**: 若路徑包含 `{id}`，自動在 `parameters` 陣列中生成對應的 path parameter 定義。

- **驗證 Checklist**:
- [ ] 撰寫單元測試：輸入一個包含動態路由 (如 `/users/:id`) 的假專案資料。
- [ ] 執行轉換函數，檢查輸出的 JSON 是否包含 `paths['/users/{id}']`。
- [ ] 將生成的 JSON 貼到 [Swagger Editor](https://editor.swagger.io/)，確認沒有語法錯誤 (如 `Schema error`)。

#### Stage 2: Fastify 插件整合與靜態掛載 (Server Integration) ✅ COMPLETED

**目標**：在 Main Process 的 Mock Server 中整合 Swagger 相關套件，並成功在瀏覽器中渲染出頁面。

- **功能實作**:
- [ ] 確認是否已安裝後端依賴：`npm install @fastify/swagger @fastify/swagger-ui`。
- [ ] 在 `server.ts` (啟動邏輯) 中引入轉換函數 `toOpenApi`。
- [ ] 在 Fastify 實例化後，**優先**註冊 Swagger 插件：
- [ ] `@fastify/swagger`: 設定 `mode: 'static'`, 並傳入生成的 `specification.document`。
- [ ] `@fastify/swagger-ui`: 設定 `routePrefix: '/docs'`, `uiConfig.docExpansion: 'list'`。

- [ ] 確保 Swagger 路由註冊在 Mock API 路由**之前**，避免被 `/:path` 等通配符攔截。

- **驗證 Checklist**:
- [ ] 啟動 Mocky 的 Server (例如 Port 8000)。
- [ ] 打開瀏覽器訪問 `http://localhost:8000/docs`。
- [ ] 能看到綠色/藍色標準的 Swagger UI 介面。
- [ ] 頁面標題顯示的是當前專案的名稱。

#### Stage 3: 前端入口與互動體驗 (UI Access Point)

**目標**：讓使用者知道這個功能存在，並能方便地一鍵開啟。

- **UI 實作**:
- [ ] **狀態列/工具列更新**：在原本顯示「Server Running :8000」的區域旁，新增一個「文件 (Docs)」按鈕或圖示。
- [ ] **按鈕狀態邏輯**：
- [ ] 當 Server **停止**時：按鈕為 Disabled (灰色) 或隱藏。
- [ ] 當 Server **運行中**時：按鈕為 Enabled (高亮/可點擊)。

- [ ] **Toast 通知優化**：當服務啟動成功時，Toast 訊息除了顯示「Started on port 8000」，新增一行小字或連結「Docs available at /docs」。

- **功能實作**:
- [ ] 實作點擊事件：呼叫 Electron 的 `shell.openExternal('http://localhost:8000/docs')`，強制使用使用者預設的瀏覽器打開，而不是在 Electron 視窗內跳轉。

- **驗證 Checklist**:
- [ ] 啟動 Server 後，Docs 按鈕變亮。
- [ ] 點擊按鈕，Chrome/Edge 瀏覽器自動彈出並載入文件頁面。
- [ ] 停止 Server 後，按鈕變回不可點擊狀態。

#### Stage 4: 動態熱更新 (Dynamic Hot Reload)

**目標**：當使用者在 Mocky 修改了 API 回應或路徑後，Swagger 文件不需要重啟 App 就能更新。

- **功能實作**:
- [ ] **監聽變更**：利用原本實作的「熱重載」機制 (Server Restart 或 Route Update)。
- [ ] **重新生成 Spec**：在 Server 重啟流程中，確保 `toOpenApi(project)` 被重新呼叫，獲取最新的 JSON。
- [ ] **Server 重啟優化**：確保 Fastify 實例銷毀 (close) 再重建的過程中，Swagger 插件也能被正確重新註冊。

- **驗證 Checklist**:
- [ ] 啟動 Server，打開 `/docs`，看到 API A。
- [ ] 在 Mocky 中將 API A 的路徑從 `/users` 改為 `/customers` 並儲存。
- [ ] 重新整理瀏覽器的 `/docs` 頁面。
- [ ] 確認文件已更新顯示為 `/customers`，且舊的 `/users` 已消失。

#### Stage 5: "Try it out" 功能與 CORS 驗證 (Functional Polish)

**目標**：確保 Swagger UI 上的「發送請求 (Try it out)」按鈕真的能打通 Mock Server，作為完美的測試工具。

- **功能實作**:
- [ ] **CORS 設定**：在 Fastify 中安裝並配置 `@fastify/cors`，允許 `origin: '*'` (或是至少允許 Swagger UI 的來源)。這是因為雖然同源，但在某些 Electron 或 Network 環境下可能會被擋。
- [ ] **Server URL 設定**：在 `toOpenApi` 轉換時，明確寫入 `servers: [{ url: 'http://localhost:8000' }]` 到 OpenAPI Spec 中，確保 Swagger UI 發送請求的目標是正確的。

- **驗證 Checklist**:
- [ ] 在瀏覽器 Swagger UI 中點擊某個 API 的 "Try it out" -> "Execute"。
- [ ] 確認 **Curl** 指令區塊顯示正確的 URL。
- [ ] 確認 **Server Response** 區塊顯示狀態碼 `200` 以及你在 Mocky 設定的 JSON 回應內容。
- [ ] 確認沒有出現 "Network Error" 或 "CORS Error" 紅色錯誤。
