<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { computed } from 'vue'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** HTTP 方法名稱 (如: GET, POST) */
  method: string
  /** API 路徑字串 */
  path: string
  /** 是否為選中狀態 */
  isActive?: boolean
}

// --- 3. 常量宣告 (Constants) ---
/**
 * HTTP 方法對應的顏色主題對映表 (消除魔術字串)
 */
const METHOD_THEMES: Record<string, string> = {
  GET: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  POST: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  PUT: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
  PATCH: 'text-green-400 bg-green-500/10 border-green-500/20'
} as const

const DEFAULT_THEME = 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'

// --- 4. 屬性與事件 (Props & Emits) ---
const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const emit = defineEmits<{
  (e: 'click'): void
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
  const theme = METHOD_THEMES[formattedMethod.value] ?? DEFAULT_THEME
  return `flex min-w-[3.5rem] items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${theme}`
})

/**
 * 容器項目的動態樣式
 */
const containerClasses = computed(() => [
  'group flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all hover:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700',
  props.isActive
    ? 'border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm'
    : 'border-transparent text-zinc-400'
])

/**
 * 路徑文字的樣式
 */
const pathClasses = computed(() => [
  'truncate font-mono transition-colors',
  props.isActive ? 'text-zinc-100' : 'group-hover:text-zinc-300'
])

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 處理選取動作
 */
const handleClick = (): void => {
  emit('click')
}
</script>

<template>
  <div
    :class="containerClasses"
    role="button"
    :tabindex="0"
    :aria-pressed="isActive"
    @click="handleClick"
    @keydown.enter="handleClick"
  >
    <span :class="badgeClasses">
      {{ formattedMethod }}
    </span>

    <span :class="pathClasses">
      {{ path }}
    </span>
  </div>
</template>
