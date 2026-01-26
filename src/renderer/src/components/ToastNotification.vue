<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUIStore } from '../stores/ui'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next'

const uiStore = useUIStore()
const { toast } = storeToRefs(uiStore)

const handleAction = (): void => {
  if (toast.value.action?.url) {
    if (toast.value.action.url.startsWith('http')) {
      // Open in browser
      window.open(toast.value.action.url, '_blank')
    }
  }
}
</script>

<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="toast.visible"
      class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-zinc-800 shadow-lg ring-1 ring-black/5"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="shrink-0">
            <CheckCircle v-if="toast.type === 'success'" class="h-6 w-6 text-emerald-400" />
            <AlertCircle v-else-if="toast.type === 'error'" class="h-6 w-6 text-red-400" />
            <Info v-else class="h-6 w-6 text-blue-400" />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-zinc-100">{{ toast.message }}</p>
            <button
              v-if="toast.action"
              type="button"
              class="mt-1 cursor-pointer text-xs font-semibold text-blue-400 hover:text-blue-300 focus:outline-none"
              @click="handleAction"
            >
              {{ toast.action.label }}
            </button>
          </div>
          <div class="ml-4 flex shrink-0">
            <button
              type="button"
              class="inline-flex cursor-pointer rounded-md bg-zinc-800 text-zinc-400 hover:text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              @click="uiStore.hideToast()"
            >
              <span class="sr-only">Close</span>
              <X class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
