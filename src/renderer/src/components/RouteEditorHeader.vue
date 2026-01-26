<!-- eslint-disable vue/no-mutating-props -->
<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, computed, type WritableComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Copy, ChevronDown } from 'lucide-vue-next'
import { HTTP_METHODS as HTTP_METHODS_SCHEMA, type Route } from '../../../shared/types'
import { METHOD_THEMES } from '../constants'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  route: Route
  port: number
}

const props = defineProps<Props>()

// Define emits
const emit = defineEmits<{
  (e: 'change', value: Partial<Route>): void
}>()
const HTTP_METHOD_OPTIONS = HTTP_METHODS_SCHEMA.options

const { t } = useI18n()

// --- 5. 響應式狀態 (State) ---
const isMethodMenuOpen = ref(false)
const isCopied = ref(false)

// 使用 Computed Proxy 來處理 Props Mutation 問題，遵循單向資料流
// Helper to create writable computed that emits change
const useRouteProperty = <K extends keyof Route>(key: K): WritableComputedRef<Route[K]> =>
  computed({
    get: (): Route[K] => props.route[key],
    set: (val: Route[K]) => emit('change', { [key]: val })
  })

const routeMethod = useRouteProperty('method')
const routePath = useRouteProperty('path')
const routeIsActive = useRouteProperty('isActive')
const routeDescription = useRouteProperty('description')

/**
 * Group name (Single Tag) - Getter/Setter proxy for props.route.tags
 */
const groupString = computed({
  get: (): string => props.route.tags?.[0] || '',
  set: (val: string) => {
    const trimmed = val.trim()
    emit('change', { tags: trimmed ? [trimmed] : [] })
  }
})

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 處理路徑輸入框失去焦點事件
 * 確保路徑以 / 開頭
 */
const handlePathBlur = (): void => {
  let p = routePath.value.trim()
  if (p && !p.startsWith('/')) {
    routePath.value = `/${p}`
  }
}

/**
 * 複製完整路徑到剪貼簿
 */
const copyPath = async (): Promise<void> => {
  const fullUrl = `http://localhost:${props.port}${props.route.path}`

  try {
    await navigator.clipboard.writeText(fullUrl)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy URL:', err)
  }
}
</script>

<template>
  <header class="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
    <div class="flex flex-col gap-4">
      <div class="flex w-full flex-row gap-4">
        <!-- Method Select -->
        <div class="relative shrink-0">
          <button
            type="button"
            class="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold transition-all focus:ring-1 focus:ring-blue-500 focus:outline-none"
            :class="[
              'h-10 rounded-md border px-4 py-2 text-zinc-100',
              METHOD_THEMES[routeMethod] || 'border-zinc-700 bg-zinc-800'
            ]"
            @click="isMethodMenuOpen = !isMethodMenuOpen"
          >
            <span>{{ routeMethod }}</span>
            <div
              class="transition-transform duration-200"
              :class="{ 'rotate-180': isMethodMenuOpen }"
            >
              <ChevronDown :size="14" />
            </div>
          </button>

          <!-- Custom Dropdown Menu -->
          <Transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0 translate-y-2"
            enter-to-class="transform scale-100 opacity-100 translate-y-0"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100 translate-y-0"
            leave-to-class="transform scale-95 opacity-0 translate-y-2"
          >
            <div
              v-if="isMethodMenuOpen"
              class="absolute top-12 left-0 z-50 w-32 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-xl ring-1 ring-black/20"
            >
              <div class="py-1">
                <button
                  v-for="option in HTTP_METHOD_OPTIONS"
                  :key="option"
                  type="button"
                  class="flex w-full cursor-pointer items-center px-4 py-2 text-left text-sm font-bold transition-colors hover:bg-zinc-800"
                  :class="[routeMethod === option ? 'bg-zinc-800' : '']"
                  @click="
                    () => {
                      routeMethod = option
                      isMethodMenuOpen = false
                    }
                  "
                >
                  <span
                    class="opacity-70"
                    :class="METHOD_THEMES[option]?.match(/text-\w+-\d+/)?.[0] || 'text-zinc-300'"
                    >{{ option }}</span
                  >
                </button>
              </div>
            </div>
          </Transition>

          <!-- Backdrop -->
          <div
            v-if="isMethodMenuOpen"
            class="fixed inset-0 z-40 bg-transparent"
            @click="isMethodMenuOpen = false"
          ></div>
        </div>
        <!-- Path Input -->
        <div class="flex-1">
          <input
            v-model="routePath"
            type="text"
            placeholder="/api/users/:id"
            class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            @blur="handlePathBlur"
          />
        </div>
        <!-- Toggle Switch -->
        <div class="pt-2">
          <label
            class="relative inline-flex cursor-pointer items-center"
            title="Enable/Disable Route"
          >
            <input v-model="routeIsActive" type="checkbox" class="peer sr-only" />
            <div
              class="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full"
            ></div>
          </label>
        </div>
      </div>

      <!-- Path Visualization -->
      <div class="flex max-w-dvw min-w-0 flex-1 items-center justify-between">
        <div
          class="relative mr-1 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-sm"
        >
          {{ t('common.url') }}
        </div>
        <div class="min-w-0 flex-1 truncate px-1">
          <span class="mr-0.5 rounded py-0.5 align-middle font-mono text-sm font-bold text-zinc-400"
            >http://localhost:{{ port }}{{ routePath }}</span
          >
        </div>
        <button
          type="button"
          class="ml-2 flex cursor-pointer items-center justify-center rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
          :class="{ 'text-emerald-400 hover:text-emerald-300': isCopied }"
          :title="isCopied ? t('common.copied') : t('common.copy')"
          @click="copyPath"
        >
          <Check v-if="isCopied" :size="14" />
          <Copy v-else :size="14" />
        </button>
      </div>

      <!-- Tags Input -->
      <div class="flex items-center">
        <div
          class="relative mr-2 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-sm"
        >
          {{ t('common.group') }}
        </div>
        <div class="flex-1">
          <input
            v-model="groupString"
            type="text"
            placeholder="e.g. User"
            class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:outline-none"
          />
        </div>
      </div>

      <!-- Inputs Container -->
      <div class="flex items-center">
        <div
          class="relative mr-2 shrink-0 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-sm"
        >
          {{ t('common.description') }}
        </div>
        <div class="flex-1 space-y-3">
          <!-- Description Input -->
          <div>
            <input
              v-model="routeDescription"
              type="text"
              :placeholder="t('common.description') + '...'"
              class="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
