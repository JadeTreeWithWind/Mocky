<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/project'
import { useUIStore } from '../stores/ui'
import { PROJECT_STATUS } from '../../../shared/types'
import { UNGROUPED_NAME } from '../constants'
import RouteEditor from '../components/RouteEditor.vue'
import ProjectSidebar from '../components/ProjectSidebar.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// --- 3. 初始化 (Initialization) ---
const route = useRoute()
const { t } = useI18n()
const projectStore = useProjectStore()
const uiStore = useUIStore()
const { routes, isLoading, projects } = storeToRefs(projectStore)

// --- 4. 響應式狀態 (State) ---
/** 當前選中的路由 ID */
const selectedRouteId = ref('')

/** 刪除確認彈窗狀態 */
const isDeleteConfirmOpen = ref(false)
/** 待刪除的路由 ID */
const routeToDeleteId = ref<string | null>(null)

/** Port 佔用提示彈窗狀態 */
const isPortBusyOpen = ref(false)
const portBusyMessage = ref('')

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

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

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
    const isUngrouped = groupName === UNGROUPED_NAME && rTags.length === 0
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
        portBusyMessage.value = t('project.port_occupied_message', {
          configured: configuredPort,
          actual: actualPort
        })
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
    uiStore.showToast(t('common.error'), 'error')
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
    uiStore.showToast(t('common.error'), 'error')
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
    uiStore.showToast(t('common.error'), 'error')
  } finally {
    isDeleteConfirmOpen.value = false
    routeToDeleteId.value = null
  }
}

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
    <ProjectSidebar
      :routes="routes"
      :is-loading="isLoading"
      :current-project="currentProject"
      :selected-route-id="selectedRouteId"
      @select="handleSelectRoute"
      @add="handleAddRoute"
      @delete="handleDeleteRoute"
      @toggle-server="toggleServer"
      @open-docs="openDocs"
      @reorder="handleGroupReorder"
    />

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
      :title="t('project.port_occupied_title')"
      :message="portBusyMessage"
      :confirm-text="t('common.ok')"
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
</style>
