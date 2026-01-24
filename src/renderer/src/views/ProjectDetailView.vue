<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/project'
import RouteItem from '../components/RouteItem.vue'

// --- 3. 初始化 (Initialization) ---
const route = useRoute()
const projectStore = useProjectStore()
const { routes, isLoading } = storeToRefs(projectStore)

// --- 4. 響應式狀態 (State) ---
/** 當前選中的路由 ID */
const selectedRouteId = ref('')

// --- 5. 計算屬性 (Computed Properties) ---

/**
 * 從路由衍生當前專案 ID (單一事實來源)
 */
const projectId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 載入當前專案的所有路由設定
 * - 若無有已選取的路由，或選取的路由不在清單中時，預設選取第一個
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
 * @param id - 路由 UUID
 */
const handleSelectRoute = (id: string): void => {
  selectedRouteId.value = id
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
      <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Routes</h3>
        <span class="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
          {{ routes.length }}
        </span>
      </div>

      <div class="flex-1 space-y-1 overflow-y-auto p-2">
        <div v-if="isLoading" class="flex h-32 items-center justify-center">
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
          />
        </div>

        <div
          v-else-if="routes.length === 0"
          class="flex h-32 items-center justify-center px-4 text-center"
        >
          <p class="text-xs text-zinc-600 italic">No routes yet. Click + to add one.</p>
        </div>

        <template v-else>
          <RouteItem
            v-for="item in routes"
            :key="item.id"
            :method="item.method"
            :path="item.path"
            :is-active="selectedRouteId === item.id"
            @click="handleSelectRoute(item.id)"
          />
        </template>
      </div>
    </aside>

    <main class="flex flex-1 flex-col bg-zinc-950">
      <Transition name="fade" mode="out-in">
        <div
          v-if="selectedRouteId"
          :key="selectedRouteId"
          class="flex flex-1 flex-col items-center justify-center"
        >
          <div class="text-center">
            <p class="mb-2 text-lg font-medium text-zinc-400">Route Editor</p>
            <p class="font-mono text-xs text-zinc-600">ID: {{ selectedRouteId }}</p>
          </div>
        </div>

        <div v-else class="flex flex-1 flex-col items-center justify-center text-center">
          <p class="mb-2 text-lg font-medium text-zinc-400">Select a route to edit</p>
          <p class="font-mono text-xs tracking-tight text-zinc-600">
            Project: {{ projectId || 'Unknown' }}
          </p>
        </div>
      </Transition>
    </main>
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
