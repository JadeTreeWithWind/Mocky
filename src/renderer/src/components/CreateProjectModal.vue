<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'

const { t } = useI18n()

// --- 2. 類型定義 (Type Definitions) ---
interface ProjectPayload {
  name: string
  port: number
  description: string
  version: string
}

interface Props {
  /** 彈窗是否顯示 */
  isOpen: boolean
  /** [Edit Mode] 初始專案資料，若存在則視為編輯模式 */
  project?: ProjectPayload & { id: string }
}

// --- 3. 常量宣告 (Constants) ---
/** 預設的服務連接埠號 */
const DEFAULT_PORT = 8000
const DEFAULT_VERSION = '1.0.0'

// --- 4. 屬性與事件 (Props & Emits) ---
const props = defineProps<Props>()
const emit = defineEmits<{
  /** 關閉彈窗事件 */
  (e: 'close'): void
  /** 建立專案事件 */
  (e: 'create', payload: ProjectPayload): void
  /** 更新專案事件 */
  (e: 'update', payload: ProjectPayload & { id: string }): void
}>()

// --- 5. 響應式狀態 (State) ---
const nameInputRef = ref<HTMLInputElement | null>(null)
const projectName = ref('') // 避免與原生屬性衝突，使用具體命名
const projectPort = ref<number>(DEFAULT_PORT)
const projectVersion = ref(DEFAULT_VERSION)
const projectDescription = ref('')

// --- 6. 計算屬性 (Computed Properties) ---

/**
 * 檢查表單內容是否合法 (符合 Guidelines 4.4 命名規範)
 */
const isFormValid = computed(() => {
  return projectName.value.trim().length > 0 && projectPort.value > 0
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 重置所有表單欄位
 */
const resetForm = (): void => {
  projectName.value = ''
  projectPort.value = DEFAULT_PORT
  projectVersion.value = DEFAULT_VERSION
  projectDescription.value = ''
}

/**
 * 根據傳入的 project prop 初始化表單
 */
const initForm = (): void => {
  if (props.project) {
    projectName.value = props.project.name
    projectPort.value = props.project.port
    projectVersion.value = props.project.version || DEFAULT_VERSION
    projectDescription.value = props.project.description
  } else {
    resetForm()
  }
}

/**
 * 關閉彈窗並執行清理
 */
const handleClose = (): void => {
  resetForm()
  emit('close')
}

/**
 * 處理表單提交邏輯
 * - 驗證表單欄位
 * - 觸發 create 事件
 * - 自動關閉並重置表單
 */
const handleSubmit = (): void => {
  if (!isFormValid.value) return // 衛句模式

  const payload = {
    name: projectName.value,
    port: projectPort.value,
    version: projectVersion.value,
    description: projectDescription.value
  }

  if (props.project) {
    emit('update', { ...payload, id: props.project.id })
  } else {
    emit('create', payload)
  }

  handleClose()
}

/**
 * 處理 Esc 鍵盤關閉邏輯
 * @param e - 鍵盤事件物件
 */
const handleKeyDown = (e: KeyboardEvent): void => {
  if (props.isOpen && e.key === 'Escape') {
    handleClose()
  }
}

// --- 8. 偵聽器 (Watchers) ---

/**
 * 監控彈窗開啟狀態，處理焦點與事件掛載
 */
watch(
  () => props.isOpen,
  async (opened) => {
    if (opened) {
      initForm()
      window.addEventListener('keydown', handleKeyDown)
      // 在 DOM 更新後自動聚焦輸入框
      await nextTick()
      nameInputRef.value?.focus()
    } else {
      window.removeEventListener('keydown', handleKeyDown)
    }
  },
  { immediate: true }
)

// --- 9. 生命週期鉤子 (Lifecycle Hooks) ---
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="w-[480px] scale-100 transform overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl transition-all"
          style="-webkit-app-region: no-drag"
          role="dialog"
          aria-modal="true"
        >
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">
              {{ props.project ? t('project.edit_project') : t('project.new_project') }}
            </h3>
            <button
              type="button"
              class="cursor-pointer rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              @click="handleClose"
            >
              <X :size="20" aria-hidden="true" />
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-400">
                {{ t('common.name') }} <span class="text-red-500">*</span>
              </label>
              <input
                ref="nameInputRef"
                v-model.trim="projectName"
                type="text"
                placeholder="e.g. E-commerce API"
                class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-400">
                {{ t('common.port') }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="projectPort"
                type="number"
                min="1"
                max="65535"
                class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-400"> {{ t('common.version') }} </label>
              <input
                v-model.trim="projectVersion"
                type="text"
                placeholder="1.0.0"
                class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-400">{{ t('common.description') }}</label>
              <textarea
                v-model="projectDescription"
                rows="3"
                :placeholder="t('common.description')"
                class="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <div class="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                @click="handleClose"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="!isFormValid"
                class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                {{ props.project ? t('common.save') : t('common.create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
