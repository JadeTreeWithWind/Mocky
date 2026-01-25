<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { computed, watch, onUnmounted } from 'vue'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** 彈窗開啟狀態 */
  isOpen: boolean
  /** 標題文字 */
  title: string
  /** 提示訊息內容 */
  message: string
  /** 確認按鈕文字 */
  confirmText?: string
  /** 取消按鈕文字 */
  cancelText?: string
  /** 是否為危險性操作（紅色按鈕） */
  isDanger?: boolean
}

// --- 3. 屬性與事件 (Props & Emits) ---
const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDanger: false
})

const emit = defineEmits<{
  /** 關閉彈窗事件 */
  (e: 'close'): void
  /** 點擊確認事件 */
  (e: 'confirm'): void
}>()

// --- 5. 計算屬性 (Computed Properties) ---

/**
 * 確認按鈕的動態樣式
 */
const confirmButtonClass = computed(() => {
  const baseClasses =
    'rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none'
  const themeClasses = props.isDanger
    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
    : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'

  return `${baseClasses} ${themeClasses}`
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 處理關閉請求
 */
const handleClose = (): void => {
  emit('close')
}

/**
 * 處理確認請求
 * - 觸發 confirm 事件後自動關閉彈窗
 */
const handleConfirm = (): void => {
  emit('confirm')
  handleClose()
}

/**
 * 鍵盤事件監聽：按下 Esc 關閉
 * @param e - 鍵盤事件物件
 */
const handleKeyDown = (e: KeyboardEvent): void => {
  if (props.isOpen && e.key === 'Escape') {
    handleClose()
  }
}

// --- 6. 偵聽器 (Watchers) ---
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      window.addEventListener('keydown', handleKeyDown)
    } else {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }
)

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---
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
          class="w-[400px] scale-100 transform overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl transition-all"
          style="-webkit-app-region: no-drag"
          role="dialog"
          aria-modal="true"
        >
          <h3 class="mb-2 text-lg font-semibold text-zinc-100">{{ title }}</h3>
          <p class="mb-6 text-sm text-zinc-400">{{ message }}</p>

          <div class="flex justify-end gap-3">
            <button
              v-if="cancelText"
              type="button"
              class="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              @click="handleClose"
            >
              {{ cancelText }}
            </button>
            <button type="button" :class="confirmButtonClass" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
