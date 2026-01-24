<script setup lang="ts">
import { Minus, Square, X } from 'lucide-vue-next'

const minimize = (): void => window.api.windowControls.minimize()
const maximize = (): void => window.api.windowControls.maximize()
const close = (): void => window.api.windowControls.close()
</script>

<template>
  <header
    class="titlebar flex h-8 w-full items-center justify-between border-b border-zinc-800 bg-zinc-900 text-zinc-100 select-none"
  >
    <div class="flex items-center gap-2 pl-3">
      <!-- App Icon/Logo Placeholder -->
      <div class="h-4 w-4 rounded-full bg-blue-500"></div>
      <span class="text-xs font-medium">Mocky</span>
    </div>

    <div class="window-controls flex h-full">
      <button
        class="flex h-full w-10 items-center justify-center transition-colors hover:bg-zinc-700"
        tabindex="-1"
        @click="minimize"
      >
        <Minus :size="14" />
      </button>
      <button
        class="flex h-full w-10 items-center justify-center transition-colors hover:bg-zinc-700"
        tabindex="-1"
        @click="maximize"
      >
        <Square :size="12" />
      </button>
      <button
        class="flex h-full w-10 items-center justify-center transition-colors hover:bg-red-600"
        tabindex="-1"
        @click="close"
      >
        <X :size="14" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  -webkit-app-region: drag;
}

.window-controls button {
  -webkit-app-region: no-drag;
}
</style>
