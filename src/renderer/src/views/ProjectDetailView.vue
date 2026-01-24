<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import RouteItem from '../components/RouteItem.vue'

const route = useRoute()

// Mock data for Stage 11 verification
const routes = ref([
  { id: '1', method: 'GET', path: '/users' },
  { id: '2', method: 'POST', path: '/users' },
  { id: '3', method: 'GET', path: '/products/:id' },
  { id: '4', method: 'DELETE', path: '/orders/:id' },
  { id: '5', method: 'PATCH', path: '/settings' }
])

const selectedRouteId = ref('1')
</script>

<template>
  <div class="flex h-full w-full">
    <!-- Route Sidebar -->
    <aside class="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/50">
      <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Routes</h3>
      </div>

      <div class="flex-1 space-y-1 overflow-y-auto p-2">
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
      <div class="text-center">
        <p class="mb-2 text-lg font-medium text-zinc-400">Select a route to edit</p>
        <p class="font-mono text-xs text-zinc-600">Project ID: {{ route.params.id }}</p>
      </div>
    </main>
  </div>
</template>
