<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { Loader2 } from 'lucide-vue-next'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** 是否顯示 Loading 狀態 */
  isLoading: boolean
}

// --- 3. 屬性與事件 (Props & Emits) ---
defineProps<Props>()
</script>

<template>
  <div
    v-if="isLoading"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div
      class="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
    >
      <Loader2 class="h-8 w-8 animate-spin text-zinc-200" />
      <span class="text-base font-medium text-zinc-300">Processing...</span>
    </div>
  </div>
</template>
