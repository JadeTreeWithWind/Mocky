<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '../stores/project'
import RouteItem from '../components/RouteItem.vue'

const route = useRoute()
const projectStore = useProjectStore()
const { routes } = storeToRefs(projectStore)

const selectedRouteId = ref('')

const loadRoutes = async (): Promise<void> => {
  const projectId = route.params.id as string
  if (projectId) {
    await projectStore.fetchRoutes(projectId)
    if (routes.value.length > 0 && !selectedRouteId.value) {
      selectedRouteId.value = routes.value[0].id
    }
  }
}

onMounted(loadRoutes)

watch(
  () => route.params.id,
  () => {
    selectedRouteId.value = ''
    loadRoutes()
  }
)
</script>

<template>
  <div class="flex h-full w-full">
    <!-- Route Sidebar -->
    <aside class="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/50">
      <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Routes</h3>
        <span class="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
          {{ routes.length }}
        </span>
      </div>

      <div class="flex-1 space-y-1 overflow-y-auto p-2">
        <div
          v-if="routes.length === 0"
          class="flex h-32 items-center justify-center px-4 text-center"
        >
          <p class="text-xs text-zinc-600 italic">No routes yet. Click + to add one.</p>
        </div>
        <RouteItem
          v-for="item in routes"
          :key="item.id"
          :method="item.method"
          :path="item.path"
          :is-active="selectedRouteId === item.id"
          @click="selectedRouteId = item.id"
        />
      </div>
    </aside>

    <!-- Editor Area (Placeholder) -->
    <main class="flex flex-1 flex-col items-center justify-center bg-zinc-950 text-zinc-500">
      <div v-if="selectedRouteId" class="text-center">
        <p class="mb-2 text-lg font-medium text-zinc-400">Route Editor</p>
        <p class="font-mono text-xs text-zinc-600">ID: {{ selectedRouteId }}</p>
      </div>
      <div v-else class="text-center">
        <p class="mb-2 text-lg font-medium text-zinc-400">Select a route to edit</p>
        <p class="font-mono text-xs text-zinc-600">Project ID: {{ route.params.id }}</p>
      </div>
    </main>
  </div>
</template>
