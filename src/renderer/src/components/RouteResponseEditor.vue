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
type ActiveTab = 'request' | 'response'

// --- 4. 屬性與事件 (Props & Emits) ---
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'change', value: Partial<Route>): void
}>()

const { t } = useI18n()

// --- 5. 響應式狀態 (State) ---
const jsonError = ref<string | null>(null)
const requestBodyError = ref<string | null>(null)
const activeTab = ref<ActiveTab>('response')

// --- 6. 計算屬性 (Computed Properties) ---
const updateResponse = (updates: Partial<Route['response']>): void => {
  if (!props.route.response) return
  emit('change', { response: { ...props.route.response, ...updates } })
}

const updateRequestBody = (updates: Partial<NonNullable<Route['requestBody']>>): void => {
  emit('change', {
    requestBody: {
      required: props.route.requestBody?.required ?? false,
      schema: props.route.requestBody?.schema ?? '{}',
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

const requestBodySchema = computed({
  get: () => props.route.requestBody?.schema ?? '{}',
  set: (val) => updateRequestBody({ schema: val })
})

const requestBodyRequired = computed({
  get: () => props.route.requestBody?.required ?? false,
  set: (val) => updateRequestBody({ required: val })
})

const requestBodyDescription = computed({
  get: () => props.route.requestBody?.description ?? '',
  set: (val) => updateRequestBody({ description: val || undefined })
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---
const getStatusLabel = (code?: number): string => {
  if (!code) return ''
  const status = HTTP_STATUS_CODES.find((s) => s.code === code)
  return status ? status.label : t('common.unknown_status')
}

const handleValidateJSON = (content: string): void => {
  jsonError.value = validateJSON(content)
}

const handleValidateRequestBodyJSON = (content: string): void => {
  requestBodyError.value = validateJSON(content)
}

const handlePrettifyJSON = (): void => {
  if (!props.route.response?.body) return
  try {
    updateResponse({ body: prettifyJSON(props.route.response.body) })
    jsonError.value = null
  } catch (e) {
    console.warn('Cannot prettify invalid JSON', e)
  }
}

const handlePrettifyRequestBodyJSON = (): void => {
  const schema = props.route.requestBody?.schema
  if (!schema) return
  try {
    updateRequestBody({ schema: prettifyJSON(schema) })
    requestBodyError.value = null
  } catch (e) {
    console.warn('Cannot prettify invalid JSON', e)
  }
}

const SAMPLE_REQUEST_BODY_SCHEMA = JSON.stringify(
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' }
    },
    required: ['name']
  },
  null,
  2
)

const fillSampleSchema = (): void => {
  requestBodySchema.value = SAMPLE_REQUEST_BODY_SCHEMA
  requestBodyError.value = null
}

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
    e.preventDefault()
    if (activeTab.value === 'request') {
      handlePrettifyRequestBodyJSON()
    } else {
      handlePrettifyJSON()
    }
  }
}

// --- 8. 偵聽器 (Watchers) ---
watch(
  () => props.route.response?.body,
  (newBody) => handleValidateJSON(newBody || ''),
  { immediate: true }
)

watch(
  () => props.route.requestBody?.schema,
  (newSchema) => handleValidateRequestBodyJSON(newSchema || '{}'),
  { immediate: true }
)

// --- 9. 生命週期鉤子 (Lifecycle Hooks) ---
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Tab Bar -->
    <div class="flex shrink-0 border-b border-zinc-800 bg-zinc-950">
      <button
        type="button"
        class="px-5 py-2.5 text-xs font-semibold transition-colors focus:outline-none"
        :class="
          activeTab === 'request'
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
        "
        @click="activeTab = 'request'"
      >
        {{ t('route.request_body') }}
      </button>
      <button
        type="button"
        class="px-5 py-2.5 text-xs font-semibold transition-colors focus:outline-none"
        :class="
          activeTab === 'response'
            ? 'border-b-2 border-blue-500 text-blue-400'
            : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
        "
        @click="activeTab = 'response'"
      >
        {{ t('route.response') }}
      </button>
    </div>

    <!-- ── Request Body Panel ── -->
    <template v-if="activeTab === 'request'">
      <!-- Request Body Toolbar -->
      <div
        class="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-2"
      >
        <div class="flex items-center gap-4">
          <!-- Required toggle -->
          <label class="flex cursor-pointer items-center gap-2">
            <input
              v-model="requestBodyRequired"
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded border-zinc-600 bg-zinc-800 accent-blue-500"
            />
            <span
              class="flex h-5 items-center rounded bg-zinc-800 px-1.5 text-[10px] font-bold tracking-wider text-zinc-400 uppercase"
            >
              {{ t('route.request_body_required') }}
            </span>
          </label>
          <!-- Description -->
          <input
            v-model="requestBodyDescription"
            type="text"
            :placeholder="t('route.request_body_description_placeholder')"
            class="w-52 rounded border border-zinc-800 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:outline-none"
          />
        </div>
        <!-- Fill Sample Button -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            @click="fillSampleSchema"
          >
            {{ t('route.fill_sample') }}
          </button>
          <!-- Format Button -->
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            title="Format JSON (Alt+Shift+F)"
            @click="handlePrettifyRequestBodyJSON"
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
      </div>

      <!-- Request Body Monaco Editor -->
      <div class="relative flex-1 bg-[#1e1e1e]">
        <VueMonacoEditor
          v-model:value="requestBodySchema"
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
            v-if="requestBodyError"
            class="absolute right-0 bottom-0 left-0 z-10 flex items-center gap-3 border-t border-red-500/30 bg-red-900/90 px-4 py-2 text-red-200 backdrop-blur-md"
          >
            <div
              class="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-300"
            >
              <AlertCircle :size="14" />
            </div>
            <span class="font-mono text-xs">{{ requestBodyError }}</span>
          </div>
        </Transition>
      </div>
    </template>

    <!-- ── Response Panel ── -->
    <template v-else>
      <!-- Response Toolbar -->
      <div
        class="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-2"
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
                <div
                  class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400"
                >
                  <ChevronDown :size="12" />
                </div>
              </div>
            </div>
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
          {{ t('route.response_body_not_available') }}
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
    </template>

    <!-- Save Status Indicator (always visible) -->
    <div
      class="absolute right-6 text-xs font-medium transition-all duration-300"
      :class="
        (activeTab === 'response' && jsonError) || (activeTab === 'request' && requestBodyError)
          ? 'bottom-12'
          : 'bottom-4'
      "
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
