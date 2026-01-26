在 Vue 3 生態系中，最成熟且標準的解決方案是 **`vue-i18n`**。實作難度不高，主要的工作量在於將目前散落在程式碼中的「硬編碼文字 (Hardcoded Strings)」抽換成變數。

這是一份針對 **Mocky 雙語系 (繁中/英文)** 的 5 階段開發計劃：

---

### 🌐 多語系 (i18n) 整合開發計劃 (5 Stages)

#### Stage 1: 核心套件安裝與配置 (Installation & Setup)

**目標**：引入 `vue-i18n` 並建立基礎配置結構。

- **實作檔案**:
- [ ] `package.json`: 安裝依賴。
- [ ] `src/i18n/index.ts`: 設定檔。
- [ ] `src/main.ts`: 掛載插件。

- **功能與操作**:
- [ ] 執行 `pnpm install vue-i18n`。
- [ ] 建立 `i18n` 實例：
- 設定 `legacy: false` (因為我們用 Vue 3 Composition API)。
- 設定 `locale: 'zh-TW'` (預設語言)。
- 設定 `fallbackLocale: 'en-US'` (缺漏時的備用)。

- [ ] 在 `main.ts` 中 `app.use(i18n)`。

- **驗證 Checklist**:
- [ ] 專案編譯成功，無 TypeScript 錯誤。
- [ ] 在瀏覽器 Console 輸入 `window.navigator.language` 確認能讀取到系統語言（作為未來自動偵測的基礎）。

#### Stage 2: 語言檔結構與字典建立 (Locale Resources)

**目標**：定義 JSON 結構，並建立繁中與英文的對照表。

- **實作檔案**:
- [ ] `src/locales/zh-TW.json`: 繁體中文檔。
- [ ] `src/locales/en-US.json`: 英文檔。

- **功能與操作**:
- [ ] 定義基礎結構 (建議使用巢狀結構以利管理)：

```json
{
  "common": {
    "confirm": "確認",
    "cancel": "取消",
    "save": "儲存"
  },
  "sidebar": {
    "projects": "專案列表",
    "settings": "設定"
  }
}
```

- [ ] 在 `i18n/index.ts` 中引入這兩個 JSON 檔案並放入 `messages` 選項。

- **驗證 Checklist**:
- [ ] 兩個 JSON 檔案的 Key 結構完全一致 (Key missing check)。
- [ ] 在任意 Vue 元件中暫時使用 `{{ $t('common.confirm') }}`，確認畫面能渲染出「確認」。

#### Stage 3: 切換開關 UI 實作 (Switcher UI)

**目標**：讓使用者能透過介面切換語言。

- **UI 實作**:
- [ ] 在 **設定頁面** 或 **側邊欄底部** 新增一個「語言/Language」下拉選單 (Select)。
- [ ] 選項包含：`繁體中文 (Traditional Chinese)` 與 `English`。

- **功能實作**:
- [ ] 使用 `useI18n()` hook 取得 `locale` 物件。
- [ ] 綁定 Select 的 `v-model` 到 `locale.value`。
- [ ] 當值改變時，整個 App 的文字應即時變更 (Reactive)。

- **驗證 Checklist**:
- [ ] 點擊切換為 English，剛剛測試的 `common.confirm` 瞬間變成 "Confirm"。
- [ ] 切換回中文，文字變回「確認」。

#### Stage 4: 使用者偏好持久化 (Persistence)

**目標**：記住使用者的選擇，重開 App 後不需要重新設定。

- **功能實作**:
- [ ] **儲存**: 監聽 `locale` 的變更 (watch)，當變更時寫入 `localStorage.setItem('user-locale', 'en-US')` (或存入 Electron Store)。
- [ ] **讀取**: 修改 `src/i18n/index.ts` 的初始設定邏輯：
- 優先讀取 `localStorage`。
- 若無，則讀取 `navigator.language` (偵測系統語言)。
- 若都不支援，預設 `zh-TW`。

- **驗證 Checklist**:
- [ ] 將語言切換成英文。
- [ ] 關閉應用程式 (或重新整理頁面)。
- [ ] 再次開啟，介面依然維持英文。

#### Stage 5: 全面替換文字 (The "Translation" Process)

**目標**：這是有點枯燥但必須的一步，將所有寫死的文字替換成變數。

- **實作範圍**:
- [ ] **Sidebar**: 專案、匯入、匯出按鈕。
- [ ] **Project List**: 標題、狀態標籤。
- [ ] **API Editor**: Method 選單、欄位標籤 (Path, Description)、按鈕 (Save, Delete)。
- [ ] **Dialogs/Toasts**: 成功/失敗訊息、確認刪除視窗的內文。

- **功能與操作**:
- [ ] 針對每一個元件，將 `<span`>設定</span>`改為`<span>{{ t('sidebar.settings') }}</span>`。
- [ ] 針對 Script 中的文字 (如 Toast)，使用 `const { t } = useI18n(); t('message.success')`。

- **驗證 Checklist**:
- [ ] **地毯式搜索**: 切換到英文版，逐頁檢查，確保沒有殘留任何中文字。
- [ ] 檢查版面 (Layout)：確認英文較長的單字 (如 "Configuration" vs "設定") 沒有導致按鈕破版或文字溢出。

---
