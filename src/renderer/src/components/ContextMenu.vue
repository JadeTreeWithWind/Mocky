<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, type Component } from 'vue'

interface Position {
  x: number
  y: number
}

interface MenuItem {
  label: string
  action: () => void
  icon?: Component
  danger?: boolean
}

const props = defineProps<{
  visible: boolean
  position: Position
  items: MenuItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const menuRef = ref<HTMLElement | null>(null)

// Close on click outside
const handleClickOutside = (event: MouseEvent): void => {
  if (props.visible && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

// Adjust position if it goes off screen (Basic implementation)
const adjustedPosition = ref({ x: 0, y: 0 })

watch(
  () => props.position,
  (newPos) => {
    // Simple adjustment logic could go here to prevent overflow
    // For now, we trust the mouse coordinates
    adjustedPosition.value = { ...newPos }
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside) // Also close on right click elsewhere
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-100 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-75 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
    <div
      v-if="visible"
      ref="menuRef"
      class="ring-opacity-5 fixed z-50 min-w-[160px] overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-lg ring-1 ring-black focus:outline-none"
      :style="{ left: `${adjustedPosition.x}px`, top: `${adjustedPosition.y}px` }"
    >
      <div class="flex flex-col gap-0.5">
        <button
          v-for="(item, index) in items"
          :key="index"
          class="group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
          :class="[
            item.danger
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
          ]"
          @click="
            () => {
              item.action()
              emit('close')
            }
          "
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            class="h-4 w-4"
            :class="
              item.danger
                ? 'text-red-400 group-hover:text-red-300'
                : 'text-zinc-500 group-hover:text-zinc-300'
            "
          />
          {{ item.label }}
        </button>
      </div>
    </div>
  </Transition>
</template>
