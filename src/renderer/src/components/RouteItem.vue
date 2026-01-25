<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { computed } from 'vue'
import { Trash2, AlertCircle } from 'lucide-vue-next'

import { METHOD_BADGE_THEMES, DEFAULT_BADGE_THEME } from '../constants'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** HTTP 方法名稱 (如: GET, POST) */
  method: string
  /** API 路徑字串 */
  path: string
  /** 是否為選中狀態 (UI Highlight) */
  isSelected?: boolean
  /** 路由是否啟用 (Server Active) */
  isEnabled?: boolean
}

// --- 3. 常量宣告 (Constants) ---
// (Moved to shared constants)

// --- 4. 屬性與事件 (Props & Emits) ---
const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isEnabled: true
})

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'delete'): void
}>()

// --- 5. 計算屬性 (Computed Properties) ---

/**
 * 格式化方法名稱 (全大寫)
 */
const formattedMethod = computed(() => props.method.toUpperCase())

/**
 * 方法標籤 (Badge) 的樣式
 */
const badgeClasses = computed(() => {
  const theme = METHOD_BADGE_THEMES[formattedMethod.value] ?? DEFAULT_BADGE_THEME
  // 如果未啟用，降低透明度
  const opacityClass = props.isEnabled ? '' : 'opacity-50 grayscale'
  return `flex min-w-[3.5rem] items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${theme} ${opacityClass}`
})

/**
 * 容器項目的動態樣式
 */
const containerClasses = computed(() => [
  'group flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700',
  props.isSelected
    ? 'border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm'
    : 'border-transparent text-zinc-400'
])

/**
 * 路徑文字的樣式
 */
const pathClasses = computed(() => [
  'truncate font-mono transition-colors',
  props.isSelected ? 'text-zinc-100' : 'group-hover:text-zinc-300',
  // 如果未啟用，增加刪除線或變灰
  props.isEnabled ? '' : 'text-zinc-600 line-through decoration-zinc-700'
])

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 處理選取動作
 */
const handleClick = (): void => {
  emit('click')
}

/**
 * 處理刪除動作 (避免冒泡)
 */
const handleDelete = (e: Event): void => {
  e.stopPropagation()
  emit('delete')
}
</script>

<template>
  <div
    :class="containerClasses"
    role="button"
    :tabindex="0"
    :aria-pressed="isSelected"
    @click="handleClick"
    @keydown.enter="handleClick"
  >
    <!-- Method Badge -->
    <span :class="badgeClasses">
      {{ formattedMethod }}
    </span>

    <!-- Path -->
    <span :class="pathClasses">
      {{ path }}
    </span>

    <!-- Disabled Indicator (Optional) -->
    <div v-if="!isEnabled" class="mr-1 ml-auto flex items-center text-zinc-600" title="Disabled">
      <AlertCircle :size="12" />
    </div>

    <!-- Delete Button -->
    <button
      :class="[
        'ml-auto flex h-6 w-6 items-center justify-center rounded text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-700 hover:text-red-400'
      ]"
      title="Delete Route"
      @click="handleDelete"
    >
      <Trash2 :size="14" />
    </button>
  </div>
</template>
