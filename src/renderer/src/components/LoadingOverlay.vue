<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

interface Props {
  isLoading: boolean
}

defineProps<Props>()
</script>

<template>
  <div
    v-if="isLoading"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
  >
    <div
      class="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
    >
      <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
      <span class="text-sm font-medium text-zinc-300">Processing...</span>
    </div>
  </div>
</template>
