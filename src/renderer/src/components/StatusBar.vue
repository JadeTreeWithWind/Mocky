<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed } from 'vue'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** 手動指定顯示狀態 (選填) */
  customStatus?: string
  /** 文件連結 URL (若有值則顯示按鈕) */
  docsUrl?: string
}

const props = defineProps<Props>()

defineEmits<{
  (e: 'open-docs'): void
}>()

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
  return 'h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
})
</script>

<template>
  <footer
    class="flex h-6 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900 px-3 text-[10px] text-zinc-400 select-none"
    role="contentinfo"
  >
    <div
      class="flex items-center gap-2"
      role="status"
      :aria-label="`Current status: ${displayStatus}`"
    >
      <div :class="indicatorClass" aria-hidden="true" />
      <span class="font-medium">{{ displayStatus }}</span>

      <button
        v-if="docsUrl"
        type="button"
        class="ml-2 flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        title="Open API Documentation"
        @click="$emit('open-docs')"
      >
        <span class="text-[10px] font-medium">Docs</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>
    </div>

    <div class="flex items-center gap-3">
      <span class="opacity-80">{{ APP_VERSION }}</span>
    </div>
  </footer>
</template>
