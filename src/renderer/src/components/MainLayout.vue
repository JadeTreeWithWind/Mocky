<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Plus, Pencil, Trash2, Download, FileDown } from 'lucide-vue-next'

import { useProjectStore } from '../stores/project'
import { toOpenApi } from '../utils/transformer'
import TitleBar from './TitleBar.vue'
import StatusBar from './StatusBar.vue'
import ProjectItem from './ProjectItem.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

import ContextMenu from './ContextMenu.vue'
import { PROJECT_STATUS } from '../../../shared/types'

// --- 2. 類型定義 (Type Definitions) ---
interface CreateProjectPayload {
  name: string
  port: number
  description: string
}

// --- 3. 初始化 (Initialization) ---
const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)

// --- 4. 響應式狀態 (State) ---
const isCreateModalOpen = ref(false)
const isConfirmDeleteOpen = ref(false)
const projectToDeleteId = ref<string | null>(null) // 命名語義化

const contextMenuState = ref({
  visible: false,
  x: 0,
  y: 0,
  projectId: ''
})

// --- 5. 計算屬性 (Computed Properties) ---

/**
 * 從路由衍生選中的專案 ID (單一事實來源)
 */
const selectedProjectId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

/**
 * 右鍵選單配置項目
 */
const contextMenuItems = computed(() => [
  {
    label: 'Edit',
    icon: Pencil,
    action: () => handleEditProject(contextMenuState.value.projectId)
  },
  {
    label: 'Export JSON',
    icon: Download,
    action: () => handleExportProject(contextMenuState.value.projectId)
  },
  {
    label: 'Delete',
    icon: Trash2,
    danger: true,
    action: () => triggerDeleteConfirm(contextMenuState.value.projectId)
  }
])

/**
 * 底部狀態列文字
 */
const statusBarText = computed(() => {
  const id = selectedProjectId.value
  if (!id) return 'Ready'

  const project = projects.value.find((p) => p.id === id)
  if (!project) return 'Ready'

  if (project.status === PROJECT_STATUS.RUNNING) {
    const runningPort = projectStore.getRunningPort(id) ?? project.port
    return `Running on :${runningPort}`
  }

  return 'Ready'
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 導航至指定專案詳情頁
 * @param id - 專案 UUID
 */
const navigateToProject = (id: string): void => {
  if (!id) return // 衛句模式
  router.push(`/project/${id}`)
}

/**
 * 處理專案建立邏輯
 * @param projectData - 包含名稱、Port、描述的專案資料
 */
const handleCreateProject = async (projectData: CreateProjectPayload): Promise<void> => {
  try {
    const newProject = await projectStore.createProject(projectData)
    isCreateModalOpen.value = false
    navigateToProject(newProject.id)
  } catch (error) {
    console.error('[Project] Creation failed:', error)
  }
}

/**
 * 觸發刪除確認彈窗
 * @param projectId - 要刪除的專案 UUID
 */
const triggerDeleteConfirm = (projectId: string): void => {
  projectToDeleteId.value = projectId
  isConfirmDeleteOpen.value = true
}

/**
 * 執行刪除專案操作
 * - 刪除成功後，若為當前專案則跳轉至首頁
 */
const handleConfirmDelete = async (): Promise<void> => {
  const idToDelete = projectToDeleteId.value
  if (!idToDelete) return // 衛句模式

  try {
    await projectStore.deleteProject(idToDelete)
    isConfirmDeleteOpen.value = false

    // 若刪除的是當前專案，則跳回首頁
    if (selectedProjectId.value === idToDelete) {
      router.push('/')
    }
  } catch (error) {
    console.error('[Project] Deletion failed:', error)
  } finally {
    projectToDeleteId.value = null
  }
}

/**
 * 開啟自定義右鍵選單
 * @param event - 滑鼠事件物件
 * @param projectId - 觸發右鍵的專案 UUID
 */
const handleOpenContextMenu = (event: MouseEvent, projectId: string): void => {
  contextMenuState.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    projectId
  }
}

/**
 * 處理編輯專案邏輯
 * @param id - 專案 UUID
 */
const handleEditProject = (id: string): void => {
  // TODO: 實作專案編輯功能（開啟編輯彈窗）
  console.log('[Project] Edit requested for:', id)
}

/**
 * 處理專案匯出邏輯
 * @param id - 專案 UUID
 */
const handleExportProject = async (id: string): Promise<void> => {
  const project = projects.value.find((p) => p.id === id)
  if (!project) return

  try {
    // 獲取該專案的所有路由
    const routes = await window.api.db.getRoutesByProjectId(id)

    // 轉換為 OpenAPI 格式
    const openApiDoc = toOpenApi(project, routes)
    const jsonContent = JSON.stringify(openApiDoc, null, 2)

    // 呼叫主進程下載
    const filename = `${project.name.replace(/\s+/g, '_')}_openapi.json`
    const success = await window.api.project.export(jsonContent, filename)

    if (success) {
      // TODO: 可以加入 Toast 提示
      console.log('Export successful')
    }
  } catch (error) {
    console.error('[Project] Export failed:', error)
  }
}

/**
 * 處理專案匯入邏輯 (Stage 3)
 */
const handleImportProject = async (): Promise<void> => {
  try {
    const content = await window.api.project.import()
    if (content) {
      const newProjectId = await projectStore.importProject(content)
      navigateToProject(newProjectId)
    }
  } catch (error) {
    console.error('[Project] Import failed:', error)
  }
}

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---
onMounted(() => {
  projectStore.fetchProjects()
})
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100">
    <TitleBar />

    <div class="flex flex-1 overflow-hidden">
      <aside class="flex w-[250px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
        <div class="flex items-center justify-between px-4 py-3">
          <h2 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Projects</h2>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              title="Import OpenAPI"
              @click="handleImportProject"
            >
              <FileDown :size="14" />
            </button>
            <button
              type="button"
              class="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              title="Create Project"
              @click="isCreateModalOpen = true"
            >
              <Plus :size="14" />
            </button>
          </div>
        </div>

        <nav class="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
          <ProjectItem
            v-for="project in projects"
            :key="project.id"
            :name="project.name"
            :port="project.port"
            :is-active="selectedProjectId === project.id"
            @click="navigateToProject(project.id)"
            @contextmenu.prevent="handleOpenContextMenu($event, project.id)"
          />
        </nav>
      </aside>

      <main class="flex-1 overflow-auto bg-zinc-950">
        <slot />
      </main>
    </div>

    <!-- 傳入動態計算的 Status -->
    <StatusBar :custom-status="statusBarText" />

    <CreateProjectModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateProject"
    />

    <ConfirmDialog
      :is-open="isConfirmDeleteOpen"
      title="Delete Project"
      message="Are you sure you want to delete this project? This action cannot be undone."
      confirm-text="Delete"
      :is-danger="true"
      @close="isConfirmDeleteOpen = false"
      @confirm="handleConfirmDelete"
    />

    <ContextMenu
      :visible="contextMenuState.visible"
      :position="{ x: contextMenuState.x, y: contextMenuState.y }"
      :items="contextMenuItems"
      @close="contextMenuState.visible = false"
    />
  </div>
</template>
