<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  isDanger: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const handleClose = (): void => {
  emit('close')
}

const handleConfirm = (): void => {
  emit('confirm')
  handleClose() // Auto close on confirm
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="props.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="w-[400px] scale-100 transform overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl transition-all"
          style="-webkit-app-region: no-drag"
        >
          <h3 class="mb-2 text-lg font-semibold text-zinc-100">{{ title }}</h3>
          <p class="mb-6 text-sm text-zinc-400">{{ message }}</p>

          <div class="flex justify-end gap-3">
            <button
              class="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              @click="handleClose"
            >
              {{ cancelText }}
            </button>
            <button
              class="rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:outline-none"
              :class="[
                isDanger
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              ]"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
