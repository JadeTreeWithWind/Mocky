<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { Minus, Square, X } from 'lucide-vue-next'

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 請求主進程最小化當前視窗
 */
const handleMinimize = (): void => {
  window.api?.windowControls?.minimize() // 安全檢查
}

/**
 * 請求主進程最大化或還原當前視窗
 */
const handleMaximize = (): void => {
  window.api?.windowControls?.maximize()
}

/**
 * 請求主進程關閉當前視窗
 */
const handleClose = (): void => {
  window.api?.windowControls?.close()
}
</script>

<template>
  <header
    class="titlebar flex h-8 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950 text-zinc-300 select-none"
    role="banner"
  >
    <div class="flex items-center gap-2 pl-3">
      <div
        class="h-4 w-4 rounded-full bg-zinc-200 shadow-sm shadow-zinc-500/20"
        aria-hidden="true"
      />
      <span class="text-sm font-semibold tracking-wide text-zinc-300 uppercase">Mocky</span>
    </div>

    <div class="window-controls flex h-full">
      <button
        type="button"
        class="flex h-full w-10 items-center justify-center transition-colors hover:bg-zinc-700"
        tabindex="-1"
        aria-label="Minimize"
        @click="handleMinimize"
      >
        <Minus :size="14" />
      </button>

      <button
        type="button"
        class="flex h-full w-10 items-center justify-center transition-colors hover:bg-zinc-700"
        tabindex="-1"
        aria-label="Maximize"
        @click="handleMaximize"
      >
        <Square :size="12" />
      </button>

      <button
        type="button"
        class="flex h-full w-10 items-center justify-center transition-colors hover:bg-red-600 active:bg-red-700"
        tabindex="-1"
        aria-label="Close"
        @click="handleClose"
      >
        <X :size="14" />
      </button>
    </div>
  </header>
</template>

<style scoped>
/* 讓整個標題列區域可拖拽視窗 */
.titlebar {
  -webkit-app-region: drag;
}

/* 確保按鈕區域排除在拖拽範圍之外，否則無法點擊 */
.window-controls button {
  -webkit-app-region: no-drag;
}
</style>
