<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/project'
import TitleBar from './TitleBar.vue'
import StatusBar from './StatusBar.vue'
import ProjectItem from './ProjectItem.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import ContextMenu from './ContextMenu.vue'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const projectStore = useProjectStore()
const { projects } = storeToRefs(projectStore)

// 1. State
const isCreateModalOpen = ref(false)
const isConfirmDeleteOpen = ref(false)
const projectToDelete = ref<string | null>(null)

// 2. State from Store
const selectedProjectId = ref<string>('')

// Context Menu State
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  projectId: ''
})

const contextMenuItems = computed(() => [
  {
    label: 'Edit',
    icon: Pencil,
    action: (): void => {
      console.log('Edit project:', contextMenu.value.projectId)
      // TODO: Implement Edit Modal
    }
  },
  {
    label: 'Delete',
    icon: Trash2,
    danger: true,
    action: (): void => {
      projectToDelete.value = contextMenu.value.projectId
      isConfirmDeleteOpen.value = true
    }
  }
])

// 3. Methods
const selectProject = (id: string): void => {
  selectedProjectId.value = id
  router.push(`/project/${id}`)
}

const handleCreateProject = async (payload: {
  name: string
  port: number
  description: string
}): Promise<void> => {
  try {
    const newProject = await projectStore.createProject(payload)
    selectProject(newProject.id)
  } catch (error) {
    console.error('Failed to create project:', error)
  }
}

const handleContextMenu = (event: MouseEvent, projectId: string): void => {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    projectId
  }
}

const handleConfirmDelete = async (): Promise<void> => {
  if (!projectToDelete.value) return

  try {
    const idToDelete = projectToDelete.value
    await projectStore.deleteProject(idToDelete)

    if (selectedProjectId.value === idToDelete) {
      router.push('/')
    }
  } catch (error) {
    console.error('Failed to delete project:', error)
  } finally {
    projectToDelete.value = null
  }
}

watch(
  () => route.params.id,
  (newId) => {
    if (typeof newId === 'string') {
      selectedProjectId.value = newId
    } else {
      selectedProjectId.value = ''
    }
  },
  { immediate: true }
)

onMounted(() => {
  projectStore.fetchProjects()
})
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100">
    <!-- Custom TitleBar -->
    <TitleBar />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="flex w-[250px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
        <div class="flex items-center justify-between px-4 py-3">
          <h2 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Projects</h2>
          <button
            class="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            @click="isCreateModalOpen = true"
          >
            <Plus :size="14" />
          </button>
        </div>

        <div class="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
          <ProjectItem
            v-for="project in projects"
            :key="project.id"
            :name="project.name"
            :port="project.port"
            :is-active="selectedProjectId === project.id"
            @click="selectProject(project.id)"
            @contextmenu="handleContextMenu($event, project.id)"
          />
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-auto bg-zinc-950">
        <slot />
      </main>
    </div>

    <!-- Status Bar -->
    <StatusBar />

    <!-- Modals -->
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
      :visible="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      :items="contextMenuItems"
      @close="contextMenu.visible = false"
    />
  </div>
</template>
