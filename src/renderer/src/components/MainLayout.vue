<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  FileDown,
  FileType,
  ChevronsRight,
  Languages,
  Check,
  ChevronUp
} from 'lucide-vue-next'

import { useProjectStore } from '../stores/project'
import { useUIStore } from '../stores/ui'
import { toOpenApi } from '../../../shared/utils/openapi-generator'
import TitleBar from './TitleBar.vue'
import StatusBar from './StatusBar.vue'
import ProjectItem from './ProjectItem.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import ErrorModal from './ErrorModal.vue'
import ToastNotification from './ToastNotification.vue'

import ContextMenu from './ContextMenu.vue'
import { PROJECT_STATUS } from '../../../shared/types'

// --- 2. 類型定義 (Type Definitions) ---
interface CreateProjectPayload {
  name: string
  port: number
  description: string
  version: string
}

// --- 3. 初始化 (Initialization) ---
const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const uiStore = useUIStore()
const { projects } = storeToRefs(projectStore)
const { locale, t } = useI18n()

// --- 4. 響應式狀態 (State) ---
const isCreateModalOpen = ref(false)
const isConfirmDeleteOpen = ref(false)
const editingProject = ref<(CreateProjectPayload & { id: string }) | undefined>(undefined)
const projectToDeleteId = ref<string | null>(null) // 命名語義化
const errorModalState = ref({
  isOpen: false,
  title: '',
  message: ''
})

const contextMenuState = ref({
  visible: false,
  x: 0,
  y: 0,
  projectId: ''
})
const isLangMenuOpen = ref(false)

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
    label: t('common.edit'),
    icon: Pencil,
    action: () => handleEditProject(contextMenuState.value.projectId)
  },
  {
    label: t('sidebar.export_json'),
    icon: Download,
    action: () => handleExportProject(contextMenuState.value.projectId)
  },
  {
    label: t('sidebar.export_html'),
    icon: FileType,
    action: () => handleExportHtml(contextMenuState.value.projectId)
  },
  {
    label: t('common.delete'),
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
  if (!id) return t('project.ready')

  const project = projects.value.find((p) => p.id === id)
  if (!project) return t('project.ready')

  if (project.status === PROJECT_STATUS.RUNNING) {
    const runningPort = projectStore.getRunningPort(id) ?? project.port
    return `${t('project.server_running')}${runningPort}`
  }

  return t('project.ready')
})

/**
 * 計算 Swagger 文件連結
 */
// const statusBarDocsUrl = computed(() => {
//   const id = selectedProjectId.value
//   if (!id) return undefined

//   const project = projects.value.find((p) => p.id === id)
//   if (!project || project.status !== PROJECT_STATUS.RUNNING) return undefined

//   const port = projectStore.getRunningPort(id) ?? project.port
//   return `http://localhost:${port}/docs`
// })

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 開啟文件連結
 */
// const handleOpenDocs = (): void => {
//   if (statusBarDocsUrl.value) {
//     window.open(statusBarDocsUrl.value, '_blank')
//   }
// }

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
 * 處理專案更新邏輯
 * @param projectData - 更新後的專案資料
 */
const handleUpdateProject = async (
  projectData: CreateProjectPayload & { id: string }
): Promise<void> => {
  try {
    await projectStore.updateProject(projectData)
    isCreateModalOpen.value = false
    editingProject.value = undefined // Reset
    uiStore.showToast('Project updated successfully', 'success')
  } catch (error) {
    console.error('[Project] Update failed:', error)
    uiStore.showToast('Failed to update project', 'error')
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
  const project = projects.value.find((p) => p.id === id)
  if (project) {
    editingProject.value = {
      id: project.id,
      name: project.name,
      port: project.port,
      description: project.description || '',
      version: project.version || '1.0.0'
    }
    isCreateModalOpen.value = true
  }
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
      console.log('Export successful')
      uiStore.showToast(t('project.export_success'), 'success')
    }
  } catch (error) {
    console.error('[Project] Export failed:', error)
    uiStore.showToast('Export failed', 'error')
  }
}

/**
 * 處理專案匯出為 HTML 邏輯
 * @param id - 專案 UUID
 */
const handleExportHtml = async (id: string): Promise<void> => {
  try {
    await projectStore.exportHtml(id)
    uiStore.showToast(t('project.export_success'), 'success')
  } catch (error) {
    console.error('[Project] Export HTML failed:', error)
    showError('Export Failed', 'Failed to export documentation to HTML. See console for details.')
  }
}

/**
 * 處理專案匯入邏輯 (Stage 3)
 */
/**
 * 顯示錯誤彈窗
 */
const showError = (title: string, message: string): void => {
  errorModalState.value = {
    isOpen: true,
    title,
    message
  }
}

/**
 * 處理專案匯入邏輯 (Stage 3 + Stage 5 Enhanced)
 */
const handleImportProject = async (): Promise<void> => {
  try {
    const content = await window.api.project.import()
    if (content) {
      // Stage 5: Postman 相容性檢查
      try {
        const json = JSON.parse(content)
        if (json.info?.schema?.includes('getpostman.com')) {
          showError(
            'Format Not Supported',
            'Postman Collection format is not currently supported. Please convert it to OpenAPI/Swagger format first.'
          )
          return
        }
      } catch {
        // Ignore JSON parse error here, let transformer handle it or it will be caught below
      }

      const newProjectId = await projectStore.importProject(content)
      navigateToProject(newProjectId)
      uiStore.showToast(t('project.import_success'), 'success')
    }
  } catch (error: unknown) {
    console.error('[Project] Import failed:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during import.'
    showError(t('project.import_failed'), errorMessage)
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
      <aside
        class="group relative flex shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out"
        :class="selectedProjectId ? 'w-10 hover:w-[250px]' : 'w-[250px]'"
      >
        <!-- Collapse Indicator -->
        <div
          v-if="selectedProjectId"
          class="pointer-events-none absolute top-3 left-0 flex w-full items-center justify-center text-zinc-300 transition-opacity duration-300 group-hover:opacity-0"
        >
          <ChevronsRight :size="20" />
        </div>

        <div
          class="flex h-full min-w-[250px] flex-col transition-opacity duration-300"
          :class="
            selectedProjectId
              ? 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
              : ''
          "
        >
          <div class="flex items-center justify-between px-4 py-3">
            <h2 class="text-sm font-bold tracking-widest text-zinc-400 uppercase">
              {{ t('sidebar.projects') }}
            </h2>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                :title="t('sidebar.import')"
                @click="handleImportProject"
              >
                <FileDown :size="14" />
              </button>
              <button
                type="button"
                class="cursor-pointer rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                :title="t('sidebar.create_project')"
                @click="
                  () => {
                    editingProject = undefined
                    isCreateModalOpen = true
                  }
                "
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

          <!-- Language Switcher -->
          <div class="relative border-t border-zinc-800 p-4">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center justify-between rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300 ring-1 ring-zinc-700 transition-all hover:bg-zinc-800 hover:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              @click="isLangMenuOpen = !isLangMenuOpen"
            >
              <div class="flex items-center gap-2">
                <Languages :size="16" class="text-zinc-400" />
                <span>{{ locale === 'zh-TW' ? '繁體中文' : 'English' }}</span>
              </div>
              <ChevronUp
                :size="16"
                class="text-zinc-500 transition-transform duration-200"
                :class="{ 'rotate-180': isLangMenuOpen }"
              />
            </button>

            <!-- Custom Dropdown Menu -->
            <Transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0 translate-y-2"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 translate-y-2"
            >
              <div
                v-if="isLangMenuOpen"
                class="absolute right-4 bottom-16 left-4 z-50 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-xl ring-1 ring-black/20"
              >
                <div class="py-1">
                  <button
                    v-for="opt in [
                      { label: '繁體中文', value: 'zh-TW' },
                      { label: 'English', value: 'en-US' }
                    ]"
                    :key="opt.value"
                    type="button"
                    class="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800"
                    :class="locale === opt.value ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-300'"
                    @click="
                      () => {
                        locale = opt.value
                        isLangMenuOpen = false
                      }
                    "
                  >
                    <span>{{ opt.label }}</span>
                    <Check v-if="locale === opt.value" :size="14" class="text-blue-500" />
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Backdrop to close on click outside -->
            <div
              v-if="isLangMenuOpen"
              class="fixed inset-0 z-40 bg-transparent"
              @click="isLangMenuOpen = false"
            ></div>
          </div>
        </div>
      </aside>

      <main class="flex-1 overflow-auto bg-zinc-950">
        <slot />
      </main>
    </div>

    <!-- 傳入動態計算的 Status -->
    <StatusBar :custom-status="statusBarText" />

    <CreateProjectModal
      :is-open="isCreateModalOpen"
      :project="editingProject"
      @close="
        () => {
          isCreateModalOpen = false
          editingProject = undefined
        }
      "
      @create="handleCreateProject"
      @update="handleUpdateProject"
    />

    <ConfirmDialog
      :is-open="isConfirmDeleteOpen"
      :title="t('project.delete_confirm_title')"
      :message="t('project.delete_confirm_message')"
      :confirm-text="t('common.delete')"
      :cancel-text="t('common.cancel')"
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

    <LoadingOverlay :is-loading="projectStore.isLoading" />

    <ErrorModal
      :is-open="errorModalState.isOpen"
      :title="errorModalState.title"
      :message="errorModalState.message"
      @close="errorModalState.isOpen = false"
    />

    <!-- Global Toast Notification -->
    <div
      aria-live="assertive"
      class="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
        <ToastNotification />
      </div>
    </div>
  </div>
</template>
