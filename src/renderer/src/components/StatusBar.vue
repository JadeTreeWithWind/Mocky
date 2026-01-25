<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed } from 'vue'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** 手動指定顯示狀態 (選填) */
  customStatus?: string
}

const props = defineProps<Props>()

// --- 3. 常量宣告 (Constants) ---
/** 應用程式版本號 */
const APP_VERSION = 'v1.0.0' // TODO: 未來應改為從 package.json 或 API 動態獲取

// --- 5. 響應式狀態 (State) ---
/** 當前系統運作狀態文字 */
const internalStatus = ref('Ready')

// --- 6. 計算屬性 (Computed Properties) ---

/**
 * 最終顯示的狀態文字 (優先使用外部傳入的狀態)
 */
const displayStatus = computed(() => {
  return props.customStatus ?? internalStatus.value
})

/**
 * 根據狀態決定指示燈的顏色
 */
const indicatorClass = computed(() => {
  // 未來可加入 'Error', 'Busy' 等不同顏色的邏輯判斷
  return 'h-2 w-2 rounded-full bg-emerald-600'
})
</script>

<template>
  <footer
    class="flex h-6 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-400 select-none"
    role="contentinfo"
  >
    <div
      class="flex items-center gap-2"
      role="status"
      :aria-label="`Current status: ${displayStatus}`"
    >
      <div :class="indicatorClass" aria-hidden="true" />
      <span class="font-medium">{{ displayStatus }}</span>
    </div>

    <div class="flex items-center gap-3">
      <span class="opacity-80">{{ APP_VERSION }}</span>
    </div>
  </footer>
</template>
