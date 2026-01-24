<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { reactive } from 'vue'

// --- 2. 類型定義 (Type Definitions) ---
interface ProcessVersions {
  electron?: string
  chrome?: string
  node?: string
}

// --- 4. 響應式狀態 (State) ---

/**
 * 從 Electron API 獲取版本資訊
 * 加入空值檢查與安全回退機制
 */
const versions = reactive<ProcessVersions>({
  electron: window.electron?.process?.versions?.electron ?? 'Unknown',
  chrome: window.electron?.process?.versions?.chrome ?? 'Unknown',
  node: window.electron?.process?.versions?.node ?? 'Unknown'
})

// --- 9. 其他 (此組件邏輯簡單，無核心函數與鉤子)
</script>

<template>
  <ul class="versions flex gap-4 font-mono text-[10px] text-zinc-500" role="list">
    <li class="electron-version">
      <span class="font-semibold text-zinc-400">Electron:</span> v{{ versions.electron }}
    </li>
    <li class="chrome-version">
      <span class="font-semibold text-zinc-400">Chromium:</span> v{{ versions.chrome }}
    </li>
    <li class="node-version">
      <span class="font-semibold text-zinc-400">Node:</span> v{{ versions.node }}
    </li>
  </ul>
</template>

<style scoped>
/* 避免版本資訊被選取，保持介面簡潔 */
.versions {
  user-select: none;
}
</style>
