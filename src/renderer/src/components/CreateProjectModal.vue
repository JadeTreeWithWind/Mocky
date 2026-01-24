<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'

// 1. Props & Emits
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', payload: { name: string; port: number; description: string }): void
}>()

// 2. Constants
const DEFAULT_PORT = 8000

// 3. State
const name = ref('')
const port = ref<number | string>(DEFAULT_PORT)
const description = ref('')

// 4. Computed
const isValid = computed(() => {
  return name.value.trim().length > 0 && Number(port.value) > 0
})

// 5. Functions
/**
 * 關閉模態窗並重置表單
 */
const handleClose = (): void => {
  resetForm()
  emit('close')
}

/**
 * 提交表單建立專案
 */
const handleSubmit = (): void => {
  if (!isValid.value) return

  emit('create', {
    name: name.value,
    port: Number(port.value),
    description: description.value
  })

  handleClose()
}

/**
 * 重置表單欄位
 */
const resetForm = (): void => {
  name.value = ''
  port.value = DEFAULT_PORT
  description.value = ''
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
          class="w-[480px] scale-100 transform overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl transition-all"
          style="-webkit-app-region: no-drag"
        >
          <!-- Header -->
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-zinc-100">建立新專案</h3>
            <button
              class="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              @click="handleClose"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- Body -->
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <!-- Project Name -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-400"
                >專案名稱 <span class="text-red-500">*</span></label
              >
              <input
                v-model="name"
                type="text"
                placeholder="例如: E-commerce API"
                class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                autofocus
              />
            </div>

            <!-- Port -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-400"
                >服務 Port <span class="text-red-500">*</span></label
              >
              <input
                v-model="port"
                type="number"
                placeholder="8000"
                class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label class="text-xs font-medium text-zinc-400">專案描述</label>
              <textarea
                v-model="description"
                rows="3"
                placeholder="輸入專案的簡短描述..."
                class="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <!-- Footer -->
            <div class="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                @click="handleClose"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="!isValid"
                class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
              >
                建立專案
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
