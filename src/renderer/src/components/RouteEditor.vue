<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useProjectStore } from '../stores/project'
import { HTTP_METHODS as HTTP_METHODS_SCHEMA } from '../../../shared/types'

// --- 2. 類型定義 (Type Definitions) ---
const props = defineProps<{
  /** 當前編輯的路由 ID */
  routeId: string
}>()

// --- 3. 初始化 (Initialization) ---
const projectStore = useProjectStore()

// --- 5. 計算屬性 (Computed Properties) ---
/**
 * 根據 ID 從 Store 獲取路由物件
 * 直接綁定 Store 中的物件以實現即時更新 (Vue Reactivity)
 * 持久化儲存將在後續 Stage 實作
 */
const route = computed(() => {
  return projectStore.routes.find((r) => r.id === props.routeId)
})

// --- 3. 常量宣告 (Constants) ---
const HTTP_METHOD_OPTIONS = HTTP_METHODS_SCHEMA.options

const HTTP_STATUS_CODES = [
  { code: 200, label: 'OK' },
  { code: 201, label: 'Created' },
  { code: 202, label: 'Accepted' },
  { code: 204, label: 'No Content' },
  { code: 301, label: 'Moved Permanently' },
  { code: 302, label: 'Found' },
  { code: 304, label: 'Not Modified' },
  { code: 400, label: 'Bad Request' },
  { code: 401, label: 'Unauthorized' },
  { code: 403, label: 'Forbidden' },
  { code: 404, label: 'Not Found' },
  { code: 405, label: 'Method Not Allowed' },
  { code: 422, label: 'Unprocessable Entity' },
  { code: 429, label: 'Too Many Requests' },
  { code: 500, label: 'Internal Server Error' },
  { code: 502, label: 'Bad Gateway' },
  { code: 503, label: 'Service Unavailable' }
]

/**
 * HTTP 方法對應的顏色主題 (與 RouteItem 保持一致或更強烈)
 */
const METHOD_THEMES: Record<string, string> = {
  GET: 'text-blue-400 border-blue-500/50 bg-blue-500/10 focus:border-blue-500 focus:ring-blue-500/30',
  POST: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 focus:border-yellow-500 focus:ring-yellow-500/30',
  PUT: 'text-orange-400 border-orange-500/50 bg-orange-500/10 focus:border-orange-500 focus:ring-orange-500/30',
  DELETE: 'text-red-400 border-red-500/50 bg-red-500/10 focus:border-red-500 focus:ring-red-500/30',
  PATCH:
    'text-green-400 border-green-500/50 bg-green-500/10 focus:border-green-500 focus:ring-green-500/30',
  OPTIONS:
    'text-purple-400 border-purple-500/50 bg-purple-500/10 focus:border-purple-500 focus:ring-purple-500/30',
  HEAD: 'text-teal-400 border-teal-500/50 bg-teal-500/10 focus:border-teal-500 focus:ring-teal-500/30'
}

/**
 * 處理路徑輸入框失去焦點事件 (Stage 18)
 * 確保路徑以 / 開頭
 */
const handlePathBlur = (): void => {
  if (!route.value) return
  let p = route.value.path.trim()
  if (p && !p.startsWith('/')) {
    route.value.path = `/${p}`
  }
}

/**
 * 解析路徑片段，用於視覺化顯示 (Stage 18 Advanced)
 * 識別 :id 等參數格式
 */
const pathSegments = computed(() => {
  if (!route.value?.path) return []
  return route.value.path
    .split('/')
    .filter(Boolean)
    .map((seg) => ({
      text: seg,
      isParam: seg.startsWith(':')
    }))
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 根據 HTTP 狀態碼取得標籤名稱
 * @param code - HTTP 狀態碼
 * @returns 狀態碼對應的標籤
 */
const getStatusLabel = (code?: number): string => {
  if (!code) return ''
  const status = HTTP_STATUS_CODES.find((s) => s.code === code)
  return status ? status.label : 'Unknown Status'
}

const methodSelectClasses = computed(() => {
  if (!route.value) return ''
  const defaultClass =
    'border-zinc-700 bg-zinc-800 text-zinc-100 focus:border-blue-500 focus:ring-blue-500'
  const themeClass = METHOD_THEMES[route.value.method] || defaultClass

  return `h-10 appearance-none rounded-md border px-4 py-2 pr-8 text-sm font-bold focus:ring-1 focus:outline-none transition-colors ${themeClass}`
})

// --- 6. 狀態管理 (State) ---
type SaveStatus = 'saved' | 'saving' | 'unsaved'
const saveStatus = ref<SaveStatus>('saved')
const saveTimeout = ref<ReturnType<typeof setTimeout> | undefined>(undefined)

/**
 * 執行儲存操作
 */
const save = async (): Promise<void> => {
  if (!route.value) return

  saveStatus.value = 'saving'
  try {
    // 深拷貝以避免 Proxy 問題 (雖 Store 已處裡，但這裡斷開參照較安全)
    await projectStore.updateRoute({ ...route.value })
    // 短暫延遲以顯示 Saving 狀態 (UX 優化)
    setTimeout(() => {
      saveStatus.value = 'saved'
    }, 500)
  } catch (error) {
    console.error('Failed to save route:', error)
    saveStatus.value = 'unsaved'
  }
}

/**
 * 防抖自動儲存 (Debounce)
 */
const debouncedSave = (): void => {
  saveStatus.value = 'unsaved'
  clearTimeout(saveTimeout.value)
  saveTimeout.value = setTimeout(() => {
    save()
  }, 1000) // 1秒後自動儲存
}

// 監聽路由資料變更
watch(
  () => route.value,
  (newVal, oldVal) => {
    // 忽略初次載入或切換路由時的變更
    if (newVal?.id !== oldVal?.id) {
      saveStatus.value = 'saved'
      // 切換路由時，立即驗證新內容
      if (newVal?.response?.body) {
        validateJSON(newVal.response.body)
      } else {
        jsonError.value = null
      }
      return
    }
    debouncedSave()
  },
  { deep: true }
)

// --- Stage 23: JSON Validation ---
const jsonError = ref<string | null>(null)

/**
 * 驗證 JSON 格式
 */
const validateJSON = (content: string): void => {
  if (!content.trim()) {
    jsonError.value = null
    return
  }
  try {
    JSON.parse(content)
    jsonError.value = null
  } catch (e: unknown) {
    // 截取錯誤訊息的第一行或簡化顯示
    if (e instanceof Error) {
      jsonError.value = e.message
    } else {
      jsonError.value = 'Invalid JSON format'
    }
  }
}

// 監聽 Body 變更以即時驗證
watch(
  () => route.value?.response?.body,
  (newBody) => {
    validateJSON(newBody || '')
  }
)

// --- Stage 25: Prettify JSON ---
/**
 * 格式化 JSON 內容
 */
const prettifyJSON = (): void => {
  if (!route.value?.response?.body) return

  try {
    const jsonObj = JSON.parse(route.value.response.body)
    route.value.response.body = JSON.stringify(jsonObj, null, 2)
    // 格式化後不需要顯示錯誤
    jsonError.value = null
  } catch (e) {
    // 如果是無效的 JSON，不執行格式化，保留錯誤提示
    console.warn('Cannot prettify invalid JSON', e)
  }
}

// 鍵盤快捷鍵監聽
const handleKeydown = (e: KeyboardEvent): void => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    clearTimeout(saveTimeout.value) // 清除自動儲存計時
    save()
  }
  // Alt + Shift + F (Common formatting shortcut)
  if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    prettifyJSON()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimeout(saveTimeout.value)
})
</script>

<template>
  <div v-if="route" class="relative flex h-full w-full flex-col">
    <!-- Stage 16: Editor Header -->
    <header class="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
      <div class="flex items-start gap-4">
        <!-- Method Select -->
        <div class="relative shrink-0">
          <select v-model="route.method" :class="methodSelectClasses">
            <option
              v-for="method in HTTP_METHOD_OPTIONS"
              :key="method"
              :value="method"
              class="bg-zinc-800 text-zinc-100"
            >
              {{ method }}
            </option>
          </select>
          <!-- Custom Arrow Icon -->
          <div
            class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        <!-- Inputs Container -->
        <div class="flex-1 space-y-3">
          <!-- Path Input & Visualization -->
          <div>
            <div class="relative">
              <input
                v-model="route.path"
                type="text"
                placeholder="/api/users/:id"
                class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                @blur="handlePathBlur"
              />
            </div>
            <!-- Path Visualization -->
            <div class="mt-1.5 flex min-h-6 flex-wrap items-center gap-0.5 px-1">
              <template v-if="pathSegments.length">
                <div v-for="(seg, index) in pathSegments" :key="index" class="flex items-center">
                  <span class="mr-0.5 text-zinc-600">/</span>
                  <span
                    :class="[
                      'rounded px-1.5 py-0.5 font-mono text-xs',
                      seg.isParam
                        ? 'border border-amber-500/30 bg-amber-500/20 text-amber-200'
                        : 'text-zinc-400'
                    ]"
                  >
                    {{ seg.text }}
                  </span>
                </div>
              </template>
              <span v-else class="font-mono text-xs text-zinc-600">/</span>
            </div>
          </div>

          <!-- Description Input -->
          <div>
            <input
              v-model="route.description"
              type="text"
              placeholder="Enter a brief description..."
              class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        <!-- Toggle Switch -->
        <div class="pt-2">
          <label
            class="relative inline-flex cursor-pointer items-center"
            title="Enable/Disable Route"
          >
            <input v-model="route.isActive" type="checkbox" class="peer sr-only" />
            <div
              class="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"
            ></div>
          </label>
        </div>
      </div>
    </header>

    <!-- Response Section -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Response Toolbar -->
      <div
        class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-2"
      >
        <div class="flex items-center gap-4">
          <!-- Stage 21: Status Code Selector -->
          <div class="flex items-center gap-2">
            <span
              class="flex h-5 items-center rounded bg-zinc-800 px-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
            >
              Status
            </span>
            <div class="group relative flex items-center">
              <input
                v-if="route.response"
                v-model.number="route.response.statusCode"
                type="number"
                class="peer w-16 rounded-l-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-center text-xs font-bold text-emerald-400 group-hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <div class="relative -ml-px">
                <select
                  :value="route.response?.statusCode"
                  class="h-[26px] w-5 appearance-none rounded-r-md border border-zinc-700 bg-zinc-800 px-0 text-transparent group-hover:border-zinc-600 hover:bg-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  @change="
                    (e) => {
                      if (route?.response)
                        route.response.statusCode = Number((e.target as HTMLSelectElement).value)
                    }
                  "
                >
                  <option
                    v-for="status in HTTP_STATUS_CODES"
                    :key="status.code"
                    :value="status.code"
                    class="text-zinc-100"
                  >
                    {{ status.code }} {{ status.label }}
                  </option>
                  <!-- Custom Option Wrapper logic handled by input, this just provides list -->
                </select>
                <!-- Chevron -->
                <div
                  class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
            <!-- Status Label Display -->
            <span class="text-xs text-zinc-500">
              {{ getStatusLabel(route.response?.statusCode) }}
            </span>
          </div>

          <!-- Stage 24: Latency Setting -->
          <div class="flex items-center gap-2 border-l border-zinc-700 pl-4">
            <span
              class="flex h-5 items-center rounded bg-zinc-800 px-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
            >
              Latency
            </span>
            <div class="flex items-center gap-1">
              <div class="relative flex items-center">
                <input
                  v-if="route.response"
                  v-model.number="route.response.delay"
                  type="number"
                  min="0"
                  step="100"
                  class="w-16 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 pr-6 text-right text-xs font-bold text-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <span class="pointer-events-none absolute right-2 text-xs text-zinc-500">ms</span>
              </div>

              <!-- Quick Options -->
              <div v-if="route.response" class="ml-1 flex items-center gap-px">
                <button
                  v-for="ms in [0, 500, 2000]"
                  :key="ms"
                  type="button"
                  class="rounded border border-transparent px-1.5 py-1 text-[10px] font-medium transition-colors"
                  :class="
                    route.response.delay === ms
                      ? 'border-blue-500/30 bg-blue-500/20 text-blue-400'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  "
                  @click="route.response!.delay = ms"
                >
                  {{ ms }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Stage 25: Format JSON Button -->
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          title="Format JSON (Alt+Shift+F)"
          @click="prettifyJSON"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
          Format
        </button>
      </div>

      <!-- Body / Monaco Editor (Stage 22) -->
      <div class="relative flex-1 bg-[#1e1e1e]">
        <VueMonacoEditor
          v-if="route.response"
          v-model:value="route.response.body"
          theme="vs-dark"
          language="json"
          :options="{
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            fontFamily: 'Menlo, Monaco, \'Courier New\', monospace'
          }"
          class="h-full w-full"
        />
        <div v-else class="flex h-full items-center justify-center text-zinc-500">
          Response body not available
        </div>

        <!-- Stage 23: Error Bar -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-2"
        >
          <div
            v-if="jsonError"
            class="absolute right-0 bottom-0 left-0 z-10 flex items-center gap-3 border-t border-red-500/30 bg-red-900/90 px-4 py-2 text-red-200 backdrop-blur-md"
          >
            <div
              class="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <span class="font-mono text-xs">{{ jsonError }}</span>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Stage 20: Save Status Indicator -->
    <div
      class="absolute right-6 text-xs font-medium transition-all duration-300"
      :class="jsonError ? 'bottom-12' : 'bottom-4'"
    >
      <span v-if="saveStatus === 'saving'" class="flex items-center gap-1 text-blue-400">
        <span class="animate-pulse">●</span> Saving...
      </span>
      <span v-else-if="saveStatus === 'saved'" class="flex items-center gap-1 text-zinc-500">
        <span class="text-emerald-500">✓</span> Saved
      </span>
      <span v-else-if="saveStatus === 'unsaved'" class="flex items-center gap-1 text-amber-500">
        <span class="animate-bounce">●</span> Unsaved
      </span>
    </div>
  </div>

  <!-- Fallback state if route not found -->
  <div v-else class="flex h-full flex-col items-center justify-center text-zinc-500">
    <p>Route not found</p>
  </div>
</template>
