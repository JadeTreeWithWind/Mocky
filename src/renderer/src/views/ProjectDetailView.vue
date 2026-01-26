<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { Plus, Search, Play, Square, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { useProjectStore } from '../stores/project'
import { useUIStore } from '../stores/ui'
import { PROJECT_STATUS, type Route } from '../../../shared/types'
import RouteItem from '../components/RouteItem.vue'
import RouteEditor from '../components/RouteEditor.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import Draggable from 'vuedraggable'

// --- 3. 初始化 (Initialization) ---
const route = useRoute()
const { t } = useI18n()
const projectStore = useProjectStore()
const uiStore = useUIStore()
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

/** Port 佔用提示彈窗狀態 */
const isPortBusyOpen = ref(false)
const portBusyMessage = ref('')

/** 當前展開的群組名稱 (Accordion Only One) */
const expandedGroup = ref<string | null>(null)

/**
 * 依照 Tags 分組路由
 */
const groupedRoutes = computed(() => {
  const map = new Map<string, Route[]>()
  const ungrouped: Route[] = []
  const list = filteredRoutes.value

  list.forEach((r) => {
    if (!r.tags || r.tags.length === 0) {
      ungrouped.push(r)
    } else {
      r.tags.forEach((tag) => {
        if (!map.has(tag)) {
          map.set(tag, [])
        }
        map.get(tag)?.push(r)
      })
    }
  })

  // Convert map to array and sort
  const groups: { name: string; routes: Route[] }[] = []

  // Add Tags (sorted alphabetically)
  const sortedTags = Array.from(map.keys()).sort()
  sortedTags.forEach((tag) => {
    groups.push({ name: tag, routes: map.get(tag)! })
  })

  // Add Ungrouped at the end
  if (ungrouped.length > 0) {
    groups.push({ name: 'Ungrouped', routes: ungrouped })
  }

  // If list is empty but we have no groups? (Handled by filteredRoutes check in template)
  // If no tags at all, just return Ungrouped
  if (groups.length === 0 && list.length > 0) {
    return [{ name: 'Ungrouped', routes: list }]
  }

  // Auto-expand first group if nothing expanded (UX improvement)
  if (groups.length > 0 && !expandedGroup.value) {
    // We defer this slightly to avoid side-effects during computed calc, usually unnecessary but safer
    // Actually, setting ref in computed is bad. Let watcher handle it or strictly user interaction.
    // For now, let's keep it closed or user-driven?
    // User asked "click other tag -> collapse old one", implying user interaction.
  }

  return groups
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 切換群組收合狀態 (Accordion)
 */
const toggleGroup = (groupName: string): void => {
  if (expandedGroup.value === groupName) {
    expandedGroup.value = null // Close if clicking same
  } else {
    expandedGroup.value = groupName // Open new, closes others
  }
}

/**
 * 處理群組內的排序 (Drag & Drop)
 * 將群組內的新順序套用到全域列表，同時保留非此群組項目的位置
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleGroupReorder = (groupName: string, newGroupRoutes: any[]): void => {
  // 1. 複製當前完整列表
  const newFullList = [...routes.value]

  // 2. 找出此群組原本包含哪些路由的「全域索引位置」
  // 邏輯：遍歷全域列表，若該路由屬於此群組，則記錄其 Index
  const targetIndices: number[] = []

  newFullList.forEach((r, index) => {
    // 判斷該路由是否屬於目前正在操作的群組
    const rTags = r.tags || []
    const isUngrouped = groupName === 'Ungrouped' && rTags.length === 0
    const hasTag = rTags.includes(groupName)

    if (isUngrouped || hasTag) {
      targetIndices.push(index)
    }
  })

  // 安全檢查：數量應該要一致
  if (targetIndices.length !== newGroupRoutes.length) {
    console.warn('[Reorder] Count mismatch, skipping update', {
      expected: targetIndices.length,
      actual: newGroupRoutes.length
    })
    return
  }

  // 3. 將新的群組順序，依序填入原本的索引位置 (Preserve Slots)
  targetIndices.forEach((targetIndex, i) => {
    newFullList[targetIndex] = newGroupRoutes[i]
  })

  // 4. 更新 Store
  projectStore.reorderRoutes(projectId.value, newFullList)
}

/**
 * 切換伺服器運行狀態
 */
const toggleServer = async (): Promise<void> => {
  if (!projectId.value) return

  try {
    if (isServerRunning.value) {
      await projectStore.stopServer(projectId.value)
    } else {
      const actualPort = await projectStore.startServer(projectId.value)

      // 檢查 Port 是否變更
      const configuredPort = currentProject.value?.port
      if (typeof actualPort === 'number' && configuredPort && actualPort !== configuredPort) {
        portBusyMessage.value = `The configured port ${configuredPort} is occupied. The server is now running on port ${actualPort}.`
        isPortBusyOpen.value = true

        // Show Toast with warning
        uiStore.showToast(
          `${t('project.server_running')}${actualPort} (auto-incremented)`,
          'info',
          {
            label: t('project.open_docs'),
            url: `http://localhost:${actualPort}/docs`
          }
        )
      } else {
        // Show Success Toast
        uiStore.showToast(`${t('project.server_running')}${actualPort}`, 'success', {
          label: t('project.open_docs'),
          url: `http://localhost:${actualPort}/docs`
        })
      }
    }
  } catch (error) {
    console.error('Failed to toggle server:', error)
    uiStore.showToast('Failed to toggle server', 'error')
  }
}

/**
 * 開啟 API 文件
 */
const openDocs = (): void => {
  if (!currentProject.value?.port) return
  const url = `http://localhost:${currentProject.value.port}/docs`
  window.open(url, '_blank')
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

// --- 5. 計算屬性 (Computed Properties) ---

/**
 * 從路由衍生當前專案 ID (單一事實來源)
 */
const projectId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

/**
 * 從專案列表取得當前專案資料
 */
const currentProject = computed(() => projects.value.find((p) => p.id === projectId.value))

/**
 * 伺服器是否運行中
 */
const isServerRunning = computed(() => currentProject.value?.status === PROJECT_STATUS.RUNNING)

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

/**
 * 依照 Tags 分組路由 (Grouped View)
 */
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
            <span class="ml-2 text-xs font-normal text-zinc-500"
              >v{{ currentProject.version || '1.0.0' }}</span
            >
          </h2>
          <button
            v-if="currentProject?.port"
            type="button"
            :class="
              isServerRunning
                ? 'cursor-pointer hover:bg-zinc-700 hover:text-zinc-200'
                : 'opacity-50'
            "
            class="ml-2 flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400"
            :title="t('project.open_docs') + ` (Port: ${currentProject.port})`"
            :disabled="!isServerRunning"
            @click.stop="openDocs"
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
          {{ isServerRunning ? t('project.stop_server') : t('project.start_server') }}
        </button>
      </div>

      <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          {{ t('common.route') }}
        </h3>

        <div class="flex items-center gap-2">
          <span class="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
            {{ routes.length }}
          </span>

          <button
            class="flex cursor-pointer items-center justify-center rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            :aria-label="t('route.new_route')"
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
            :placeholder="t('route.search_placeholder')"
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
            {{ t('route.no_routes') }}
          </p>
          <p v-else class="text-xs text-zinc-600 italic">{{ t('route.no_match') }}</p>
        </div>

        <template v-else>
          <!-- Search Mode: Flat List -->
          <template v-if="searchQuery">
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

          <!-- Standard Mode: Grouped Accordion with Drag & Drop -->
          <template v-else>
            <template v-for="group in groupedRoutes" :key="group.name">
              <!-- Group Header -->
              <div
                v-if="group.name !== 'Ungrouped' || group.routes.length > 0"
                class="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                @click="toggleGroup(group.name)"
              >
                <div class="flex items-center gap-1.5">
                  <component
                    :is="expandedGroup === group.name ? ChevronDown : ChevronRight"
                    :size="12"
                  />
                  <span :class="group.name === 'Ungrouped' ? 'italic opacity-70' : ''">
                    {{ group.name === 'Ungrouped' ? t('common.group') + ' (None)' : group.name }}
                  </span>
                </div>
                <span class="text-[10px] text-zinc-600">{{ group.routes.length }}</span>
              </div>

              <!-- Routes List (Draggable) -->
              <div v-show="expandedGroup === group.name" class="pl-2">
                <Draggable
                  :model-value="group.routes"
                  item-key="id"
                  :animation="200"
                  ghost-class="ghost"
                  class="flex flex-col space-y-1"
                  @update:model-value="(val) => handleGroupReorder(group.name, val)"
                >
                  <template #item="{ element }">
                    <RouteItem
                      :method="element.method"
                      :path="element.path"
                      :is-selected="selectedRouteId === element.id"
                      :is-enabled="element.isActive"
                      @click="handleSelectRoute(element.id)"
                      @delete="handleDeleteRoute(element.id)"
                    />
                  </template>
                </Draggable>
              </div>
            </template>
          </template>
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
          <p class="mb-2 text-lg font-medium text-zinc-400">{{ t('route.select_to_edit') }}</p>
          <p class="font-mono text-xs tracking-tight text-zinc-600">
            {{ t('common.project') }}: {{ projectId || 'Unknown' }}
          </p>
        </div>
      </Transition>
    </main>

    <ConfirmDialog
      :is-open="isDeleteConfirmOpen"
      :title="t('route.delete_confirm_title')"
      :message="t('route.delete_confirm_message')"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
      :is-danger="true"
      @close="isDeleteConfirmOpen = false"
      @confirm="executeDeleteRoute"
    />

    <ConfirmDialog
      :is-open="isPortBusyOpen"
      title="Port Occupied"
      :message="portBusyMessage"
      confirm-text="OK"
      :cancel-text="''"
      @close="isPortBusyOpen = false"
      @confirm="isPortBusyOpen = false"
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

.ghost {
  opacity: 0.5;
  background-color: #27272a; /* zinc-800 */
}
</style>
