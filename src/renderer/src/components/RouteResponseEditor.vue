<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useI18n } from 'vue-i18n'
import { ChevronDown, AlertCircle, Loader2, Check } from 'lucide-vue-next'
import { HTTP_STATUS_CODES, SAVE_STATUS, type SaveStatus } from '../constants'
import { validateJSON, prettifyJSON } from '../utils/jsonUtils'
import type { Route } from '../../../shared/types'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  route: Route
  saveStatus: SaveStatus
}

// --- 3. 常量宣告 (Constants) ---
// None

// --- 4. 屬性與事件 (Props & Emits) ---
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'change', value: Partial<Route>): void
}>()

const { t } = useI18n()

// --- 5. 響應式狀態 (State) ---
const jsonError = ref<string | null>(null)

// --- 6. 計算屬性 (Computed Properties) ---
/**
 * 輔助函數：發送 Response 更新事件
 */
const updateResponse = (updates: Partial<Route['response']>): void => {
  if (!props.route.response) return

  emit('change', {
    response: {
      ...props.route.response,
      ...updates
    }
  })
}

const responseStatusCode = computed({
  get: () => props.route.response?.statusCode,
  set: (val) => val && updateResponse({ statusCode: val })
})

const responseDelay = computed({
  get: () => props.route.response?.delay,
  set: (val) => val !== undefined && updateResponse({ delay: val })
})

const responseBody = computed({
  get: () => props.route.response?.body ?? '',
  set: (val) => updateResponse({ body: val })
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 根據 HTTP 狀態碼取得標籤名稱
 */
const getStatusLabel = (code?: number): string => {
  if (!code) return ''
  const status = HTTP_STATUS_CODES.find((s) => s.code === code)
  return status ? status.label : 'Unknown Status'
}

/**
 * 驗證 JSON 格式
 */
const handleValidateJSON = (content: string): void => {
  jsonError.value = validateJSON(content)
}

/**
 * 格式化 JSON 內容
 */
const handlePrettifyJSON = (): void => {
  if (!props.route.response?.body) return

  try {
    const prettified = prettifyJSON(props.route.response.body)
    updateResponse({ body: prettified })
    // 格式化後不需要顯示錯誤
    jsonError.value = null
  } catch (e) {
    console.warn('Cannot prettify invalid JSON', e)
  }
}

const handleKeydown = (e: KeyboardEvent): void => {
  // Alt + Shift + F (Common formatting shortcut)
  if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    handlePrettifyJSON()
  }
}

// --- 6. 偵聽器 (Watchers) ---
// 監聽 Body 變更以即時驗證
watch(
  () => props.route.response?.body,
  (newBody) => {
    handleValidateJSON(newBody || '')
  },
  { immediate: true }
)

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Response Toolbar -->
    <div
      class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-2"
    >
      <div class="flex items-center gap-4">
        <!-- Status Code Selector -->
        <div class="flex items-center gap-2">
          <span
            class="flex h-5 items-center rounded bg-zinc-800 px-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
          >
            {{ t('common.status') }}
          </span>
          <div class="group relative flex items-center">
            <input
              v-if="route.response"
              v-model.number="responseStatusCode"
              type="number"
              class="peer w-16 rounded-l-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-center text-xs font-bold text-emerald-400 group-hover:border-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            <div class="relative -ml-px">
              <select
                :value="route.response?.statusCode"
                class="h-[26px] w-5 appearance-none rounded-r-md border border-zinc-700 bg-zinc-800 px-0 text-transparent group-hover:border-zinc-600 hover:bg-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                @change="
                  (e) => {
                    responseStatusCode = Number((e.target as HTMLSelectElement).value)
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
              </select>
              <!-- Chevron -->
              <div
                class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400"
              >
                <ChevronDown :size="12" />
              </div>
            </div>
          </div>
          <!-- Status Label Display -->
          <span class="text-xs text-zinc-500">
            {{ getStatusLabel(route.response?.statusCode) }}
          </span>
        </div>

        <!-- Latency Setting -->
        <div class="flex items-center gap-2 border-l border-zinc-700 pl-4">
          <span
            class="flex h-5 items-center rounded bg-zinc-800 px-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
          >
            {{ t('common.latency') }}
          </span>
          <div class="flex items-center gap-1">
            <div class="relative flex items-center">
              <input
                v-if="route.response"
                v-model.number="responseDelay"
                type="number"
                min="0"
                step="100"
                class="w-20 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 pr-6 text-right text-xs font-bold text-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <span class="pointer-events-none absolute right-2 text-xs text-zinc-500">{{
                t('common.ms')
              }}</span>
            </div>

            <!-- Quick Options -->
            <div v-if="route.response" class="ml-1 flex items-center gap-px">
              <button
                v-for="ms in [0, 500, 2000]"
                :key="ms"
                type="button"
                class="cursor-pointer rounded border border-transparent px-1.5 py-1 text-[10px] font-medium transition-colors"
                :class="
                  route.response.delay === ms
                    ? 'border-blue-500/30 bg-blue-500/20 text-blue-400'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                "
                @click="responseDelay = ms"
              >
                {{ ms }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Format JSON Button -->
      <button
        type="button"
        class="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
        {{ t('common.format') }}
      </button>
    </div>

    <!-- Body / Monaco Editor -->
    <div class="relative flex-1 bg-[#1e1e1e]">
      <VueMonacoEditor
        v-if="route.response"
        v-model:value="responseBody"
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

      <!-- Error Bar -->
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
            <AlertCircle :size="14" />
          </div>
          <span class="font-mono text-xs">{{ jsonError }}</span>
        </div>
      </Transition>
    </div>

    <!-- Save Status Indicator -->
    <div
      class="absolute right-6 text-xs font-medium transition-all duration-300"
      :class="jsonError ? 'bottom-12' : 'bottom-4'"
    >
      <span
        v-if="saveStatus === SAVE_STATUS.SAVING"
        class="flex items-center justify-center gap-1 text-blue-400"
      >
        <Loader2 :size="12" class="animate-spin" /> {{ t('route.saving') }}
      </span>
      <span
        v-else-if="saveStatus === SAVE_STATUS.SAVED"
        class="flex items-center gap-1 text-zinc-500"
      >
        <Check :size="12" class="text-emerald-500" /> {{ t('route.saved') }}
      </span>
      <span
        v-else-if="saveStatus === SAVE_STATUS.UNSAVED"
        class="flex items-center gap-1 text-amber-500"
      >
        <Loader2 :size="12" class="animate-spin" /> {{ t('route.unsaved') }}
      </span>
    </div>
  </div>
</template>
