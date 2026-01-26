<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { AlertCircle, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** 彈窗是否開啟 */
  isOpen: boolean
  /** 錯誤標題 */
  title?: string
  /** 錯誤訊息內容 */
  message?: string
}

// --- 3. 屬性與事件 (Props & Emits) ---
withDefaults(defineProps<Props>(), {
  title: 'Error',
  message: 'An unexpected error occurred.'
})

const emit = defineEmits<{
  /** 關閉彈窗事件 */
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="w-[400px] overflow-hidden rounded-xl border border-red-900/50 bg-zinc-900 shadow-2xl"
        >
          <div
            class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3"
          >
            <div class="flex items-center gap-2 text-red-400">
              <AlertCircle class="h-5 w-5" />
              <h3 class="font-semibold">{{ title }}</h3>
            </div>
            <button
              class="cursor-pointer rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              @click="emit('close')"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="p-4">
            <p class="text-sm leading-relaxed text-zinc-300">{{ message }}</p>
          </div>

          <div class="flex justify-end border-t border-zinc-800 bg-zinc-900/50 p-3">
            <button
              class="cursor-pointer rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
              @click="emit('close')"
            >
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
