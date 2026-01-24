<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  method: string
  path: string
  isActive?: boolean
}>()

const methodColor = computed(() => {
  const m = props.method.toUpperCase()
  switch (m) {
    case 'GET':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    case 'POST':
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    case 'PUT':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'DELETE':
      return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'PATCH':
      return 'text-green-400 bg-green-500/10 border-green-500/20'
    default:
      return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  }
})
</script>

<template>
  <div
    class="group flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all hover:bg-zinc-800"
    :class="[
      isActive ? 'border-zinc-700 bg-zinc-800 text-zinc-100' : 'border-transparent text-zinc-400'
    ]"
  >
    <span
      class="flex min-w-[3.5rem] items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
      :class="methodColor"
    >
      {{ method.toUpperCase() }}
    </span>
    <span class="truncate font-mono" :class="{ 'text-zinc-100': isActive }">
      {{ path }}
    </span>
  </div>
</template>
