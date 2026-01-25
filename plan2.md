這是一份專門針對 **「匯入/匯出 (OpenAPI/Swagger 整合)」** 的 5 階段開發計劃。這部分的邏輯比較吃重（涉及到資料結構轉換），建議單獨作為一個模組來開發。

---

### 🔄 匯入/匯出功能開發計劃 (5 Stages)

#### Stage 1: 資料轉換層 (Transformation Layer)

**目標**：不涉及 UI，純粹實作 Mocky 內部資料結構與 OpenAPI 3.0 規範之間的轉換邏輯。

- **功能實作**:
- [ ] 安裝 `openapi-types` 庫，獲取標準的 TypeScript 定義。
- [ ] 建立 `src/utils/transformer.ts`。
- [ ] 實作 `toOpenApi(project: Project): OpenAPIV3.Document` 函數：
- [ ] 將 Mocky 的 `Project` 資訊映射到 `info` (title, version)。
- [ ] 將 Mocky 的 `routes` 轉換為 `paths` 物件。
- [ ] 將 Mocky 的 `response.body` 轉換為 `content['application/json'].example`。

- [ ] 實作 `fromOpenApi(json: OpenAPIV3.Document): Project` 函數：
- [ ] 解析 `paths` 並展平為 Mocky 的 `Route` 陣列。
- [ ] 為每個匯入的路由生成新的 UUID。

- **驗證**:
- [ ] 撰寫一個單元測試 (Unit Test) 或簡單腳本：輸入一個假的 Mocky Project 物件，轉換出的 JSON 能通過 [Swagger Editor](https://editor.swagger.io/) 的語法檢查。

#### Stage 2: 匯出功能與檔案存檔 (Export Flow)

**目標**：讓使用者能將當前專案存成 `.json` 檔案。

- **UI 實作**:
- [ ] 在專案右鍵選單 (Context Menu) 或設定頁增加「匯出專案 (Export JSON)」按鈕。

- **功能實作**:
- [ ] 實作 Main Process IPC: `project:export`。
- [ ] 使用 Electron `dialog.showSaveDialog` 讓使用者選擇儲存路徑。
- [ ] 呼叫 Stage 1 的 `toOpenApi` 轉換資料。
- [ ] 使用 `fs.writeFile` 將 JSON 寫入磁碟。
- [ ] 實作「匯出成功」的 Toast 通知。

- **驗證**:
- [ ] 點擊匯出，彈出存檔視窗。
- [ ] 存檔後，用 VS Code 打開該檔案，內容為標準 JSON 格式且包含專案資料。

#### Stage 3: 匯入 UI 與檔案讀取 (Import Flow - UI & IO)

**目標**：建立匯入的入口，並處理檔案讀取權限。

- **UI 實作**:
- [ ] 在側邊欄底部或新增專案旁，增加「匯入 (Import)」按鈕。
- [ ] (選用) 支援 **Drag & Drop**：將 `.json` 檔案拖入側邊欄區域觸發匯入。

- **功能實作**:
- [ ] 實作 Main Process IPC: `project:import-file`。
- [ ] 使用 Electron `dialog.showOpenDialog` (限制副檔名為 `.json`)。
- [ ] 使用 `fs.readFile` 讀取檔案內容字串。
- [ ] 基礎防呆：檢查 JSON 是否包含 `openapi` 或 `swagger` 關鍵字，若無則拋出錯誤。

- **驗證**:
- [ ] 點擊匯入，選擇一個非 JSON 檔案，系統應拒絕或報錯。
- [ ] 選擇一個正確的 JSON 檔案，Console 能印出讀取到的 Object 內容。

#### Stage 4: 匯入解析與資料庫寫入 (Import Parsing & Persistence)

**目標**：將讀取的外部資料真正轉化為 Mocky 的專案並存入 DB。

- **功能實作**:
- [ ] 呼叫 Stage 1 的 `fromOpenApi` 進行轉換。
- [ ] **資料清洗**：
- [ ] 處理 OpenAPI 的 `{parameters}` (路徑參數)，轉換為 Mocky 的格式。
- [ ] 處理多個 Response 的情況 (Mocky 暫時只支援一個預設回應，需選取 `200` 或第一個可用的回應)。

- [ ] 呼叫 DB 的 `createProject` 寫入新專案。
- [ ] 前端 Store 接收回傳的新專案 ID，並自動切換路由到該新專案。

- **驗證**:
- [ ] 匯入一個標準的 Swagger 範例檔 (如 Petstore)，側邊欄出現 "Swagger Petstore" 專案。
- [ ] 點擊該專案，能看到所有 API 路徑都已正確列出。

#### Stage 5: 邊界測試與相容性優化 (Edge Cases & Polish)

**目標**：處理真實世界中雜亂的 Swagger 檔案，確保 App 不會崩潰。

- **UI 實作**:
- [ ] 增加 Loading 遮罩：當匯入大檔案 (如 > 5MB) 時顯示轉圈圈。
- [ ] 錯誤處理 Modal：如果解析失敗，顯示具體的錯誤原因 (如 "Missing 'paths' property")。

- **功能實作**:
- [ ] **容錯處理**：若 OpenAPI 檔案缺少 `title`，自動命名為 "Imported Project"。
- [ ] **Postman 相容 (可選)**：偵測如果是 Postman Collection 格式 (檢查 `info.schema` 包含 `getpostman.com`)，給予提示「暫不支援 Postman 格式，請先轉為 OpenAPI」。

- **驗證**:
- [ ] **壓力測試**：嘗試匯入一個擁有 100+ API 的大型 JSON 檔，介面不應卡死超過 2 秒。
- [ ] **完整性驗證**：匯入後啟動 Server，用 Postman 呼叫其中一個 API，確認回傳的 JSON 結構與原始定義一致。

---

### 💡 開發建議

建議從 [Swagger Petstore (Simple)](https://petstore.swagger.io/v2/swagger.json) 下載一份標準 JSON 作為你的測試基準資料 (Golden Sample)。如果你的 App 能完美匯入並匯出這份檔案，這個功能就算是大功告成了。
