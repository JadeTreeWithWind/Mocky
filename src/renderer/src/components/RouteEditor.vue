<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
// 第三方庫
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

// 內部資源
import { useProjectStore } from '../stores/project'
import RouteEditorHeader from './RouteEditorHeader.vue'
import RouteResponseEditor from './RouteResponseEditor.vue'
import type { Route } from '../../../shared/types'

// --- 2. 類型定義 (Type Definitions) ---
const props = defineProps<{
  /** 當前編輯的路由 ID */
  routeId: string
}>()

// --- 3. 常量宣告 (Constants) ---
const SAVE_DELAY_MS = 300
const SAVING_INDICATOR_MS = 500

// --- 4. 響應式狀態 (State) ---
// Store use
const projectStore = useProjectStore()

type SaveStatus = 'saved' | 'saving' | 'unsaved'
const saveStatus = ref<SaveStatus>('saved')
const saveTimeout = ref<ReturnType<typeof setTimeout> | undefined>(undefined)

// --- 5. 計算屬性 (Computed Properties) ---
/**
 * 根據 ID 從 Store 獲取路由物件
 * 直接綁定 Store 中的物件以實現即時更新 (Vue Reactivity)
 * 持久化儲存將在後續 Stage 實作
 */
const route = computed(() => {
  return projectStore.routes.find((r) => r.id === props.routeId)
})

/**
 * 獲取當前路由所屬專案的 Port
 * 優先顯示實際運行中的 Port (Running Port)
 * 若未運行則顯示設定的 Port
 */
const port = computed(() => {
  if (!route.value) return 8000
  const projectId = route.value.projectId

  // 優先檢查是否有正在運行的 Port
  const running = projectStore.runningPorts[projectId]
  if (running) return running

  // 否則查找專案設定
  const project = projectStore.projects.find((p) => p.id === projectId)
  return project?.port || 8000
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 執行儲存操作
 */
const save = async (): Promise<void> => {
  if (!route.value) return

  saveStatus.value = 'saving'
  try {
    // 深拷貝以避免 Proxy 問題 (雖 Store 已處裡，但這裡斷開參照較安全)
    await projectStore.updateRoute({ ...route.value })
    // 短暫延遲以顯示 Saving 狀態 (UX 優化)
    setTimeout(() => {
      saveStatus.value = 'saved'
    }, SAVING_INDICATOR_MS)
  } catch (error) {
    console.error('Failed to save route:', error)
    saveStatus.value = 'unsaved'
  }
}

/**
 * 處理 Header 變更事件
 * 將變更套用到 route 物件 (Pinia Store)
 */
const onHeaderChange = (updates: Partial<Route>): void => {
  if (!route.value) return
  Object.assign(route.value, updates)
}

/**
 * 防抖自動儲存 (Debounce)
 */
const debouncedSave = (): void => {
  saveStatus.value = 'unsaved'
  clearTimeout(saveTimeout.value)
  saveTimeout.value = setTimeout(() => {
    save()
  }, SAVE_DELAY_MS) // 1秒後自動儲存
}

// 鍵盤快捷鍵監聽
const handleKeydown = (e: KeyboardEvent): void => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    clearTimeout(saveTimeout.value) // 清除自動儲存計時
    save()
  }
}

// --- 6. 偵聽器 (Watchers) ---
// 監聽路由資料變更
watch(
  () => route.value,
  (newVal, oldVal) => {
    // 忽略初次載入或切換路由時的變更
    if (newVal?.id !== oldVal?.id) {
      saveStatus.value = 'saved'
      return
    }
    debouncedSave()
  },
  { deep: true }
)

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  clearTimeout(saveTimeout.value)
})
</script>

<template>
  <div v-if="route" class="relative flex h-full w-full max-w-[calc(100vw-300px)] flex-col">
    <!-- Header Section -->
    <RouteEditorHeader :route="route" :port="port" @change="onHeaderChange" />

    <!-- Response Section -->
    <RouteResponseEditor :route="route" :save-status="saveStatus" @change="onHeaderChange" />
  </div>

  <!-- Fallback state if route not found -->
  <div v-else class="flex h-full flex-col items-center justify-center text-zinc-500">
    <p>Route not found</p>
  </div>
</template>
