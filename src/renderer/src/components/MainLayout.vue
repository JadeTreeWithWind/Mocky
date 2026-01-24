<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import TitleBar from './TitleBar.vue'
import ProjectItem from './ProjectItem.vue'

interface Project {
  id: string
  name: string
  port: number
}

const router = useRouter()
const route = useRoute()

// Mock Data
const projects = ref<Project[]>([
  { id: '1', name: 'E-commerce API', port: 8000 },
  { id: '2', name: 'User Auth Service', port: 8001 },
  { id: '3', name: 'Payment Gateway', port: 8002 },
  { id: '4', name: 'Analytics Dashboard', port: 8003 },
  { id: '5', name: 'Mobile App Backend', port: 8004 }
])

const selectedProjectId = ref<string>('')

const selectProject = (id: string): void => {
  selectedProjectId.value = id
  router.push(`/project/${id}`)
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
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100">
    <!-- Custom TitleBar -->
    <TitleBar />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <!-- Sidebar -->
      <aside class="flex w-[250px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
        <div class="flex items-center justify-between px-4 py-3">
          <h2 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Projects</h2>
          <button
            class="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
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
          />
        </div>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-auto bg-zinc-950 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
