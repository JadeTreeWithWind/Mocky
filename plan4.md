### 📑 Redoc 靜態文件導出開發計劃 (5 Stages)

#### Stage 1: 建立 HTML 模版生成器 (Template Engine)

**目標**：不涉及 UI，純粹撰寫一個函數，能接收 OpenAPI JSON 物件，並回傳一個完整的 HTML 字串。

- **功能實作**:
- [ ] 建立 `src/utils/htmlGenerator.ts`。
- [ ] 實作 `generateRedocHtml(spec: object, title: string): string` 函數。
- [ ] **模版內容設計**:
- [ ] `<!DOCTYPE html>` 基礎結構。
- [ ] `<title>${title}</title>`。
- [ ] 引入 Redoc Standalone Script (推薦使用 CDN 連結，例如 `https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js`)。
- [ ] **關鍵步驟**: 在 `<body>` 中加入 `<div id="redoc-container"></div>`。
- [ ] **資料注入**: 在 `<script>` 標籤中，宣告 `const spec = ${JSON.stringify(spec)};`。
- [ ] **初始化**: 加入 `Redoc.init(spec, options, document.getElementById('redoc-container'))` 程式碼。

- **驗證 Checklist**:
- [ ] 寫一個簡單的測試腳本，傳入假資料，將回傳的字串存成 `test.html`。
- [ ] 用瀏覽器打開 `test.html`，確認能看到 Redoc 的載入畫面 (Loading...) 以及渲染後的內容。

#### Stage 2: 匯出邏輯與 IPC 串接 (Export Logic)

**目標**：在 Main Process 處理檔案存檔對話框與寫入邏輯。

- **功能實作**:
- [ ] 實作 Main Process IPC: `project:export-html`。
- [ ] **轉換流程**: 接收到請求後，先呼叫 `toOpenApi(project)` 取得 Spec。
- [ ] **生成 HTML**: 呼叫 `generateRedocHtml` 取得 HTML 字串。
- [ ] **存檔對話框**: 使用 `dialog.showSaveDialog`，過濾器設定為 `[{ name: 'HTML', extensions: ['html'] }]`。
- [ ] **寫入檔案**: 使用 `fs.writeFile` 將 HTML 字串寫入磁碟。

- **驗證 Checklist**:
- [ ] 確認 `showSaveDialog` 預設檔名建議為 `專案名稱-docs.html`。
- [ ] 確認存檔後的檔案大小合理 (包含完整的 JSON 內容)。

#### Stage 3: UI 入口與互動 (UI Integration)

**目標**：在前端提供操作入口，並給予使用者反饋。

- **UI 實作**:
- [ ] **按鈕位置**: 在「匯出 (Export)」選單中，區分 `Export as JSON (OpenAPI)` 與 `Export as HTML (Redoc)` 兩個選項。
- [ ] **圖示區隔**: JSON 使用 `{}` 圖示，HTML 使用文件或網頁圖示。
- [ ] **Loading 狀態**: 匯出過程 (轉換+寫入) 若超過 500ms，按鈕應顯示 Loading Spinner。

- **驗證 Checklist**:
- [ ] 點擊「Export as HTML」，彈出存檔視窗。
- [ ] 存檔成功後，顯示 Toast 通知：「文件已匯出 (Documentation Exported)」。
- [ ] Toast 通知上可增加一個「開啟檔案 (Open File)」的按鈕 (呼叫 `shell.showItemInFolder`)。

#### Stage 4: 離線支援與資源優化 (Offline Support - Optional but Recommended)

**目標**：目前的實作依賴 CDN，如果使用者沒網路會開不起來。此階段將 Redoc 腳本「內嵌」進去，實現 100% 離線可用。

- **功能實作**:
- [ ] 下載 `redoc.standalone.js` 檔案放入專案 `assets` 資料夾。
- [ ] 修改 `generateRedocHtml` 函數：
- [ ] 使用 `fs.readFileSync` 讀取本地的 JS 檔案內容。
- [ ] 將讀取到的 JS code 直接插入到 HTML 的 `<script>...</script>` 標籤內 (Inline Script)。

- [ ] **注意**: 這樣會導致生成的 HTML 檔案變大 (約 1-2MB)，但保證隨處可用。

- **驗證 Checklist**:
- [ ] **斷網測試**: 拔掉網路線 / 關閉 Wi-Fi。
- [ ] 雙擊生成的 HTML 檔案，確認 Redoc 依然能完美渲染，無報錯。

#### Stage 5: 樣式客製化 (Styling & Configuration)

**目標**：利用 Redoc 的強大配置功能，讓輸出的文件帶有 Mocky 的品牌色或使用者偏好。

- **功能實作**:
- [ ] 擴充 `generateRedocHtml` 的參數，接受 `themeOptions`。
- [ ] 設定 Redoc 的 `options.theme`：
- [ ] `colors.primary.main`: 設定為 Mocky 的主色調 (例如藍色或紫色)。
- [ ] `sidebar.backgroundColor`: 設定側邊欄顏色。

- [ ] **隱藏下載按鈕**: 設定 `hideDownloadButton: true` (因為這已經是靜態檔了)。

- **驗證 Checklist**:
- [ ] 打開生成的 HTML，確認左側選單顏色與 Mocky App 的風格一致。
- [ ] 確認頁面上沒有多餘的 "Download Spec" 按鈕干擾視覺。

---
