<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
// 第三方庫
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

// 內部資源
import { useProjectStore } from '../stores/project'
import { HTTP_METHODS as HTTP_METHODS_SCHEMA } from '../../../shared/types'
import { HTTP_STATUS_CODES, METHOD_THEMES } from '../constants'
import { validateJSON, prettifyJSON } from '../utils/jsonUtils'

// --- 2. 類型定義 (Type Definitions) ---
const props = defineProps<{
  /** 當前編輯的路由 ID */
  routeId: string
}>()

// --- 3. 常量宣告 (Constants) ---
const HTTP_METHOD_OPTIONS = HTTP_METHODS_SCHEMA.options

const SAVE_DELAY_MS = 300
const SAVING_INDICATOR_MS = 300

// --- 4. 響應式狀態 (State) ---
// Store use
const projectStore = useProjectStore()

type SaveStatus = 'saved' | 'saving' | 'unsaved'
const saveStatus = ref<SaveStatus>('saved')
const saveTimeout = ref<ReturnType<typeof setTimeout> | undefined>(undefined)

// Stage 23: JSON Validation
const jsonError = ref<string | null>(null)

// Copy feedback state
const isCopied = ref(false)

// --- 5. 計算屬性 (Computed Properties) ---
/**
 * 根據 ID 從 Store 獲取路由物件
 * 直接綁定 Store 中的物件以實現即時更新 (Vue Reactivity)
 * 持久化儲存將在後續 Stage 實作
 */
const route = computed(() => {
  return projectStore.routes.find((r) => r.id === props.routeId)
})

const methodSelectClasses = computed(() => {
  if (!route.value) return ''
  const defaultClass =
    'border-zinc-700 bg-zinc-800 text-zinc-100 focus:border-blue-500 focus:ring-blue-500'
  const themeClass = METHOD_THEMES[route.value.method] || defaultClass

  return `h-10 appearance-none rounded-md border px-4 py-2 pr-8 text-sm font-bold focus:ring-1 focus:outline-none transition-colors ${themeClass}`
})

/**
 * 獲取當前路由所屬專案的 Port
 * 優先顯示實際運行中的 Port (Running Port)
 * 若未運行則顯示設定的 Port
 */
const port = computed(() => {
  if (!route.value) return 8000
  const projectId = route.value.projectId

  // 優先檢查是否有正在運行的 Port
  const running = projectStore.runningPorts[projectId]
  if (running) return running

  // 否則查找專案設定
  const project = projectStore.projects.find((p) => p.id === projectId)
  return project?.port || 8000
})

/**
 * Group name (Single Tag)
 */
const groupString = computed({
  get: () => route.value?.tags?.[0] || '',
  set: (val: string) => {
    if (route.value) {
      const trimmed = val.trim()
      route.value.tags = trimmed ? [trimmed] : []
    }
  }
})

// --- 6. 偵聽器 (Watchers) ---
// 監聽路由資料變更
watch(
  () => route.value,
  (newVal, oldVal) => {
    // 忽略初次載入或切換路由時的變更
    if (newVal?.id !== oldVal?.id) {
      saveStatus.value = 'saved'
      // 切換路由時，立即驗證新內容
      if (newVal?.response?.body) {
        handleValidateJSON(newVal.response.body)
      } else {
        jsonError.value = null
      }
      return
    }
    debouncedSave()
  },
  { deep: true }
)

// 監聽 Body 變更以即時驗證
watch(
  () => route.value?.response?.body,
  (newBody) => {
    handleValidateJSON(newBody || '')
  }
)

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
 * 複製完整路徑到剪貼簿
 */
const copyPath = async (): Promise<void> => {
  if (!route.value) return

  const fullUrl = `http://localhost:${port.value}${route.value.path}`

  try {
    await navigator.clipboard.writeText(fullUrl)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy URL:', err)
  }
}

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
    }, SAVING_INDICATOR_MS)
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
  }, SAVE_DELAY_MS) // 1秒後自動儲存
}

/**
 * 驗證 JSON 格式
 */
const handleValidateJSON = (content: string): void => {
  jsonError.value = validateJSON(content)
}

// --- Stage 25: Prettify JSON ---
/**
 * 格式化 JSON 內容
 */
const handlePrettifyJSON = (): void => {
  if (!route.value?.response?.body) return

  try {
    route.value.response.body = prettifyJSON(route.value.response.body)
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
    handlePrettifyJSON()
  }
}

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimeout(saveTimeout.value)
})
</script>

<template>
  <div v-if="route" class="relative flex h-full w-full max-w-[calc(100vw-300px)] flex-col">
    <!-- Stage 16: Editor Header -->
    <header class="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
      <div class="flex flex-col gap-4">
        <div class="flex w-full flex-row gap-4">
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
          <!-- Path Input -->
          <div class="flex-1">
            <input
              v-model="route.path"
              type="text"
              placeholder="/api/users/:id"
              class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              @blur="handlePathBlur"
            />
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

        <!-- completed path -->

        <!-- Path Visualization -->
        <div class="flex max-w-dvw min-w-0 flex-1 items-center justify-between">
          <div
            class="relative mr-1 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-sm"
          >
            URL
          </div>
          <div class="mt-1.5 min-w-0 flex-1 truncate px-1">
            <span
              class="mr-0.5 rounded py-0.5 align-middle font-mono text-sm font-bold text-zinc-400"
              >http://localhost:{{ port }}{{ route.path }}</span
            >
          </div>
          <button
            type="button"
            class="ml-2 flex cursor-pointer items-center justify-center rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
            :class="{ 'text-emerald-400 hover:text-emerald-300': isCopied }"
            :title="isCopied ? 'Copied!' : 'Copy full URL'"
            @click="copyPath"
          >
            <!-- Check Icon (Copied) -->
            <svg
              v-if="isCopied"
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <!-- Copy Icon (Default) -->
            <svg
              v-else
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
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>

        <!-- Tags Input (Stage New) -->
        <div class="flex items-center">
          <div
            class="relative mr-2 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-sm"
          >
            Group
          </div>
          <div class="flex-1">
            <input
              v-model="groupString"
              type="text"
              placeholder="e.g. User"
              class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:outline-none"
            />
          </div>
        </div>

        <!-- Inputs Container -->
        <div class="flex items-center">
          <div
            class="relative mr-2 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-sm"
          >
            Description
          </div>
          <div class="flex-1 space-y-3">
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
                  class="w-20 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 pr-6 text-right text-xs font-bold text-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
          @click="handlePrettifyJSON"
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
