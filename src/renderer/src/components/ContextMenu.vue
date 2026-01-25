<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { onMounted, onUnmounted, ref, watch, nextTick, type Component } from 'vue'

// --- 2. 類型定義 (Type Definitions) ---
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

// --- 3. 屬性與事件 (Props & Emits) ---
const props = defineProps<{
  visible: boolean // 改回原有名稱以確保父組件相容性
  position: Position
  items: MenuItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// --- 4. 響應式狀態 (State) ---
const menuRef = ref<HTMLElement | null>(null)
const adjustedPosition = ref<Position>({ x: 0, y: 0 })

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 更新選單位置並處理邊界溢出
 * - 先同步座標，確保選單能第一時間出現在滑鼠位置
 * - 再檢查是否超出螢幕邊界並調整
 */
const updatePosition = async (): Promise<void> => {
  // 優先同步座標，確保選單能第一時間出現在滑鼠位置
  adjustedPosition.value = { ...props.position }

  if (!props.visible) return //

  await nextTick()
  if (!menuRef.value) return

  const { innerWidth, innerHeight } = window
  const { offsetWidth, offsetHeight } = menuRef.value

  let { x, y } = props.position

  // 右邊界檢查：若超出螢幕則向左偏移
  if (x + offsetWidth > innerWidth) {
    x = innerWidth - offsetWidth - 4
  }
  // 下邊界檢查：若超出螢幕則向上偏移
  if (y + offsetHeight > innerHeight) {
    y = innerHeight - offsetHeight - 4
  }

  adjustedPosition.value = { x, y }
}

/**
 * 處理選單外部點擊
 * @param event - 滑鼠事件物件
 */
const handleClickOutside = (event: MouseEvent): void => {
  if (props.visible && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

/**
 * 處理鍵盤 Esc 關閉
 * @param e - 鍵盤事件物件
 */
const handleKeyDown = (e: KeyboardEvent): void => {
  if (props.visible && e.key === 'Escape') {
    emit('close')
  }
}

/**
 * 處理選單項目點擊
 * @param item - 選單項目物件
 */
const handleItemClick = (item: MenuItem): void => {
  item.action?.() // 安全空值檢查
  emit('close')
}

// --- 6. 偵聽器 (Watchers) ---

// 當位置改變時立即更新
watch(
  () => props.position,
  () => updatePosition(),
  { deep: true, immediate: true }
)

// 當選單開啟時，再次確認邊界
watch(
  () => props.visible,
  (val) => {
    if (val) updatePosition()
  }
)

// --- 8. 生命週期鉤子 (Lifecycle Hooks) ---

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside, { capture: true }) // 使用 capture 確保攔截
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
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
      class="fixed z-50 min-w-[180px] overflow-hidden rounded-md border border-zinc-800 bg-zinc-900/98 p-1 shadow-2xl ring-1 ring-white/10 backdrop-blur-md focus:outline-none"
      :style="{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`
      }"
    >
      <div class="flex flex-col gap-0.5">
        <button
          v-for="item in items"
          :key="item.label"
          type="button"
          class="group flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-base transition-colors"
          :class="[
            item.danger
              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
              : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
          ]"
          @click="handleItemClick(item)"
        >
          <component
            :is="item.icon"
            v-if="item.icon"
            class="h-5 w-5"
            :class="item.danger ? 'text-red-400/80' : 'text-zinc-400 group-hover:text-zinc-200'"
          />
          <span class="flex-1">{{ item.label }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>
