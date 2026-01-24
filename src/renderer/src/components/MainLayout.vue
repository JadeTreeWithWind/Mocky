<script setup lang="ts">
import TitleBar from './TitleBar.vue'
</script>

<template>
  <div class="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100">
    <!-- Custom TitleBar -->
    <TitleBar />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="flex w-[250px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-900">
        <div class="p-4 text-sm text-zinc-400">Sidebar Area</div>
      </aside>

      <!-- Content -->
      <main class="flex-1 overflow-auto bg-zinc-950 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
