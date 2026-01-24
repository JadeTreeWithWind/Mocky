<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { computed } from 'vue'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  /** 專案顯示名稱 */
  name: string
  /** 服務運行的連接埠 */
  port: number
  /** 是否為當前選中狀態 */
  isActive?: boolean
}

// --- 3. 屬性與事件 (Props & Emits) ---
const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const emit = defineEmits<{
  /** 點擊項目時觸發 */
  (e: 'click'): void
  /** 右鍵點擊項目時觸發，並傳回 MouseEvent */
  (e: 'contextmenu', event: MouseEvent): void
}>()

// --- 5. 計算屬性 (Computed Properties) ---

/**
 * 容器主體的動態樣式
 */
const containerClasses = computed(() => [
  'group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50',
  props.isActive
    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
])

/**
 * 狀態指示燈的樣式
 */
const indicatorClasses = computed(() => [
  'h-2 w-2 shrink-0 rounded-full transition-colors',
  props.isActive ? 'bg-green-500' : 'bg-zinc-600 group-hover:bg-zinc-500'
])

/**
 * Port 標籤的樣式
 */
const badgeClasses = computed(() => [
  'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-colors',
  props.isActive
    ? 'bg-zinc-700 text-zinc-300'
    : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-400'
])

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 處理點擊事件
 */
const handleClick = (): void => {
  emit('click')
}

/**
 * 處理右鍵選單事件，並阻止預設行為與冒泡
 * @param event - 滑鼠事件物件
 */
const handleContextMenu = (event: MouseEvent): void => {
  emit('contextmenu', event)
}
</script>

<template>
  <div
    :class="containerClasses"
    role="button"
    :tabindex="0"
    :aria-current="isActive ? 'true' : undefined"
    @click="handleClick"
    @keydown.enter="handleClick"
    @contextmenu.prevent.stop="handleContextMenu($event)"
  >
    <div class="flex items-center gap-2 overflow-hidden">
      <div :class="indicatorClasses" aria-hidden="true" />
      <span class="truncate font-medium">{{ name }}</span>
    </div>

    <span :class="badgeClasses">
      {{ port }}
    </span>
  </div>
</template>
