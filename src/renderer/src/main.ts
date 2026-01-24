// --- 1. 外部引用 (Imports) ---
// 第三方庫
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { loader } from '@guolao/vue-monaco-editor'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// 內部資源
import App from './App.vue'
import router from './router'

// 樣式引入（最後）
import './assets/main.css'

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 取得 Monaco Editor 對應語言的 Worker
 * @param label - 語言標籤 (json, css, scss, less, html, typescript, javascript 等)
 * @returns 對應的 Worker 實例
 */
const getMonacoWorker = (_: string, label: string): Worker => {
  if (label === 'json') {
    return new jsonWorker()
  }
  if (label === 'css' || label === 'scss' || label === 'less') {
    return new cssWorker()
  }
  if (label === 'html' || label === 'handlebars' || label === 'razor') {
    return new htmlWorker()
  }
  if (label === 'typescript' || label === 'javascript') {
    return new tsWorker()
  }
  return new editorWorker()
}

// --- 8. 應用程式初始化 (Initialization) ---

// 配置 Monaco Editor 使用本地資源而非 CDN
self.MonacoEnvironment = {
  getWorker: getMonacoWorker
}

loader.config({ monaco })

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.mount('#app')
