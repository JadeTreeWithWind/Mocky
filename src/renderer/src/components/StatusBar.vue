<script setup lang="ts">
import { ref } from 'vue'

const status = ref('Ready')
const version = ref('v1.0.0')

// TODO: Future integration with real server status
</script>

<template>
  <footer
    class="flex h-6 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900 px-3 text-[10px] text-zinc-400 select-none"
  >
    <div class="flex items-center gap-2">
      <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
      <span>{{ status }}</span>
    </div>
    <div>
      <span>{{ version }}</span>
    </div>
  </footer>
</template>
