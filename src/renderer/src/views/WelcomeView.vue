<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { MonitorPlay } from 'lucide-vue-next' // 使用專案統一的圖標庫
</script>

<template>
  <div
    class="flex h-full flex-col items-center justify-center p-8 text-center"
    role="region"
    aria-labelledby="welcome-title"
  >
    <div class="mb-6 rounded-full bg-zinc-900 p-6 shadow-xl ring-1 ring-zinc-800">
      <MonitorPlay :size="48" class="text-zinc-500" aria-hidden="true" />
    </div>

    <h2 id="welcome-title" class="mb-3 text-2xl font-bold tracking-tight text-zinc-100">
      Welcome to Mocky
    </h2>

    <p class="max-w-[300px] text-sm leading-relaxed text-zinc-400">
      Select a project from the sidebar to get started, or create a new one to begin your API
      journey.
    </p>

    <div class="mt-8 h-px w-16 bg-linear-to-r from-transparent via-zinc-700 to-transparent" />
  </div>
</template>

<style scoped>
/* 確保歡迎頁面不會被選取文字，提升應用程式感 */
div {
  user-select: none;
}
</style>
