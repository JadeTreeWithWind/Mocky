<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Plus, Search, Play, Square } from 'lucide-vue-next'
import { useProjectStore } from '../stores/project'
import { PROJECT_STATUS } from '../../../shared/types'
import RouteItem from '../components/RouteItem.vue'
import RouteEditor from '../components/RouteEditor.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// --- 3. 初始化 (Initialization) ---
const route = useRoute()
const projectStore = useProjectStore()
const { routes, isLoading, projects } = storeToRefs(projectStore)

// --- 4. 響應式狀態 (State) ---
/** 當前選中的路由 ID */
const selectedRouteId = ref('')
/** 路由列表搜尋關鍵字 */
const searchQuery = ref('')
/** 刪除確認彈窗狀態 */
const isDeleteConfirmOpen = ref(false)
/** 待刪除的路由 ID */
const routeToDeleteId = ref<string | null>(null)

// --- 5. 計算屬性 (Computed Properties) ---

/**
 * 從專案列表取得當前專案資料
 */
const currentProject = computed(() => projects.value.find((p) => p.id === projectId.value))

/**
 * 伺服器是否運行中
 */
const isServerRunning = computed(() => currentProject.value?.status === PROJECT_STATUS.RUNNING)

/**
 * 從路由衍生當前專案 ID (單一事實來源)
 */
const projectId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

/**
 * 根據搜尋關鍵字過濾路由列表
 */
const filteredRoutes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return routes.value

  return routes.value.filter(
    (r) =>
      r.path.toLowerCase().includes(query) ||
      (r.description && r.description.toLowerCase().includes(query))
  )
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 切換伺服器運行狀態
 */
const toggleServer = async (): Promise<void> => {
  if (!projectId.value) return

  try {
    if (isServerRunning.value) {
      await projectStore.stopServer(projectId.value)
    } else {
      await projectStore.startServer(projectId.value)
    }
  } catch (error) {
    console.error('Failed to toggle server:', error)
  }
}

/**
 * 載入當前專案的所有路由設定
 */
const loadProjectRoutes = async (): Promise<void> => {
  if (!projectId.value) return // 衛句模式

  await projectStore.fetchRoutes(projectId.value)

  // 若當前未選取路由，或選取的路由不在清單中，預設選取第一個
  const isSelectedValid = routes.value.some((r) => r.id === selectedRouteId.value)
  if (routes.value.length > 0 && !isSelectedValid) {
    selectedRouteId.value = routes.value[0].id
  }
}

/**
 * 處理路由項目的選取動作
 */
const handleSelectRoute = (id: string): void => {
  selectedRouteId.value = id
}

/**
 * 快速新增路由
 */
const handleAddRoute = async (): Promise<void> => {
  if (!projectId.value) return

  try {
    const newRouteId = await projectStore.createRoute(projectId.value)
    // 新增後自動選中該路由
    selectedRouteId.value = newRouteId
  } catch (error) {
    console.error('Failed to quick add route', error)
  }
}

/**
 * 刪除路由
 */
/**
 * 觸發刪除路由確認
 */
const handleDeleteRoute = (id: string): void => {
  routeToDeleteId.value = id
  isDeleteConfirmOpen.value = true
}

/**
 * 執行刪除路由操作
 */
const executeDeleteRoute = async (): Promise<void> => {
  if (!routeToDeleteId.value) return

  try {
    await projectStore.deleteRoute(routeToDeleteId.value)
    if (selectedRouteId.value === routeToDeleteId.value) {
      selectedRouteId.value = ''
    }
  } catch (error) {
    console.error('Failed to delete route', error)
  } finally {
    isDeleteConfirmOpen.value = false
    routeToDeleteId.value = null
  }
}

// --- 6. 偵聽器 (Watchers) ---

/**
 * 監聽專案 ID 變化，更換專案時重置狀態並重新讀取
 */
watch(
  projectId,
  (newId) => {
    if (!newId) return
    selectedRouteId.value = ''
    loadProjectRoutes()
  },
  { immediate: true }
)

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---
onMounted(() => {
  if (routes.value.length === 0) {
    loadProjectRoutes()
  }
})
</script>

<template>
  <div class="flex h-full w-full overflow-hidden bg-zinc-950">
    <aside class="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/30">
      <!-- Server Control -->
      <div v-if="currentProject" class="flex flex-col border-b border-zinc-800 bg-zinc-900/50 p-3">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="truncate text-sm font-bold text-zinc-100" :title="currentProject.name">
            {{ currentProject.name }}
          </h2>
          <span class="text-[10px] text-zinc-500">Port: {{ currentProject.port }}</span>
        </div>
        <button
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            isServerRunning
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
          "
          @click="toggleServer"
        >
          <component :is="isServerRunning ? Square : Play" :size="12" class="fill-current" />
          {{ isServerRunning ? 'Stop Server' : 'Start Server' }}
        </button>
      </div>

      <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Routes</h3>

        <div class="flex items-center gap-2">
          <span class="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {{ routes.length }}
          </span>

          <button
            class="flex items-center justify-center rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Add Route"
            @click="handleAddRoute"
          >
            <Plus :size="14" />
          </button>
        </div>
      </div>

      <!-- Search Box -->
      <div class="p-2 pb-0">
        <div class="group relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search routes..."
            class="w-full rounded border border-zinc-800 bg-zinc-950/50 py-1.5 pr-2 pl-8 text-xs text-zinc-300 placeholder-zinc-600 transition-colors focus:border-zinc-700 focus:outline-none"
          />
          <Search
            :size="12"
            class="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-zinc-400"
          />
        </div>
      </div>

      <div class="flex-1 space-y-1 overflow-y-auto p-2">
        <div v-if="isLoading" class="flex h-32 items-center justify-center">
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
          />
        </div>

        <div
          v-else-if="filteredRoutes.length === 0"
          class="flex h-32 flex-col items-center justify-center space-y-2 px-4 text-center"
        >
          <p v-if="routes.length === 0" class="text-xs text-zinc-600 italic">
            No routes yet. Click + to add one.
          </p>
          <p v-else class="text-xs text-zinc-600 italic">No routes match your search.</p>
        </div>

        <template v-else>
          <RouteItem
            v-for="item in filteredRoutes"
            :key="item.id"
            :method="item.method"
            :path="item.path"
            :is-selected="selectedRouteId === item.id"
            :is-enabled="item.isActive"
            @click="handleSelectRoute(item.id)"
            @delete="handleDeleteRoute(item.id)"
          />
        </template>
      </div>
    </aside>

    <main class="flex flex-1 flex-col bg-zinc-950">
      <Transition name="fade" mode="out-in">
        <div
          v-if="selectedRouteId"
          :key="selectedRouteId"
          class="flex flex-1 flex-col overflow-hidden"
        >
          <RouteEditor :route-id="selectedRouteId" />
        </div>

        <div v-else class="flex flex-1 flex-col items-center justify-center text-center">
          <p class="mb-2 text-lg font-medium text-zinc-400">Select a route to edit</p>
          <p class="font-mono text-xs tracking-tight text-zinc-600">
            Project: {{ projectId || 'Unknown' }}
          </p>
        </div>
      </Transition>
    </main>

    <ConfirmDialog
      :is-open="isDeleteConfirmOpen"
      title="Delete Route"
      message="Are you sure you want to delete this route? This action cannot be undone."
      confirm-text="Delete"
      :is-danger="true"
      @close="isDeleteConfirmOpen = false"
      @confirm="executeDeleteRoute"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
