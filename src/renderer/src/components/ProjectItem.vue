<script setup lang="ts">
// defineProps and defineEmits are compiler macros and don't need to be imported

defineProps<{
  name: string
  port: number
  isActive?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <div
    class="group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-all duration-200"
    :class="[
      isActive
        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
    ]"
    @click="emit('click')"
  >
    <div class="flex items-center gap-2 overflow-hidden">
      <!-- Project Icon Placeholder (Optional) -->
      <div
        class="h-2 w-2 shrink-0 rounded-full transition-colors"
        :class="isActive ? 'bg-green-500' : 'bg-zinc-600 group-hover:bg-zinc-500'"
      ></div>
      <span class="truncate font-medium">{{ name }}</span>
    </div>

    <span
      class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors"
      :class="[
        isActive
          ? 'bg-zinc-700 text-zinc-300'
          : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-400'
      ]"
    >
      {{ port }}
    </span>
  </div>
</template>
