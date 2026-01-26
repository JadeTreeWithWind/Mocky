<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MonitorPlay, Rocket } from 'lucide-vue-next'
import { useProjectStore } from '../stores/project'
import { DEMO_PROJECT } from '../data/demo-project'

const router = useRouter()
const projectStore = useProjectStore()
const isCreatingDemo = ref(false)

const handleCreateDemo = async (): Promise<void> => {
  if (isCreatingDemo.value) return

  isCreatingDemo.value = true
  try {
    const jsonString = JSON.stringify(DEMO_PROJECT)
    const newProjectId = await projectStore.importProject(jsonString)
    router.push(`/project/${newProjectId}`)
  } catch (error) {
    console.error('Failed to create demo project:', error)
  } finally {
    isCreatingDemo.value = false
  }
} // 使用專案統一的圖標庫
</script>

<template>
  <div
    class="flex h-full flex-col items-center justify-center p-8 text-center"
    role="region"
    aria-labelledby="welcome-title"
  >
    <div class="mb-6 rounded-full bg-zinc-900 p-6 shadow-xl ring-1 ring-zinc-800">
      <MonitorPlay :size="48" class="text-zinc-500" aria-hidden="true" />
    </div>

    <h2 id="welcome-title" class="mb-3 text-3xl font-bold tracking-tight text-zinc-100">
      Welcome to Mocky
    </h2>

    <p class="max-w-[400px] text-base leading-relaxed text-zinc-400">
      Select a project from the sidebar to get started, or create a new one to begin your API
      journey.
    </p>

    <div class="mt-8 flex flex-col items-center gap-4">
      <button
        type="button"
        class="group flex items-center gap-2 rounded-full bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-zinc-900/20 transition-all hover:scale-105 hover:bg-white focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="isCreatingDemo"
        @click="handleCreateDemo"
      >
        <Rocket
          :size="18"
          class="text-zinc-600 transition-colors group-hover:text-zinc-900"
          :class="{ 'animate-pulse': isCreatingDemo }"
        />
        <span>{{ isCreatingDemo ? 'Creating...' : 'Get Started with Demo' }}</span>
      </button>

      <div class="h-px w-16 bg-linear-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  </div>
</template>

<style scoped>
/* 確保歡迎頁面不會被選取文字，提升應用程式感 */
div {
  user-select: none;
}
</style>
