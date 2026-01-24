<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { computed } from 'vue'
import { useProjectStore } from '../stores/project'
import { HTTP_METHODS as HTTP_METHODS_SCHEMA } from '../../../shared/types'

// --- 2. 類型定義 (Type Definitions) ---
const props = defineProps<{
  /** 當前編輯的路由 ID */
  routeId: string
}>()

// --- 3. 初始化 (Initialization) ---
const projectStore = useProjectStore()

// --- 5. 計算屬性 (Computed Properties) ---
/**
 * 根據 ID 從 Store 獲取路由物件
 * 直接綁定 Store 中的物件以實現即時更新 (Vue Reactivity)
 * 持久化儲存將在後續 Stage 實作
 */
const route = computed(() => {
  return projectStore.routes.find((r) => r.id === props.routeId)
})

// --- 常量定義 ---
const httpMethodOptions = HTTP_METHODS_SCHEMA.options
</script>

<template>
  <div v-if="route" class="flex h-full w-full flex-col">
    <!-- Stage 16: Editor Header -->
    <header class="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
      <div class="flex items-center gap-3">
        <!-- Method Select -->
        <div class="relative">
          <select
            v-model="route.method"
            class="h-10 appearance-none rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 pr-8 text-sm font-bold text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option v-for="method in httpMethodOptions" :key="method" :value="method">
              {{ method }}
            </option>
          </select>
          <!-- Custom Arrow Icon -->
          <div
            class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400"
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
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        <!-- Path Input -->
        <div class="flex-1">
          <input
            v-model="route.path"
            type="text"
            placeholder="/api/resource"
            class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>
    </header>

    <!-- Placeholder for Body/Response Editor (Future Stages) -->
    <div class="flex-1 p-6">
      <div class="rounded-lg border border-dashed border-zinc-800 p-8 text-center">
        <p class="text-sm text-zinc-500">Response Editor will be implemented in future stages.</p>
      </div>
    </div>
  </div>

  <!-- Fallback state if route not found -->
  <div v-else class="flex h-full flex-col items-center justify-center text-zinc-500">
    <p>Route not found</p>
  </div>
</template>
