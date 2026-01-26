<script setup lang="ts">
// --- 1. 外部引用 (Imports) ---
import { ref, toRef, computed } from 'vue'
import { Plus, Search, Play, Square, ChevronDown, ChevronRight } from 'lucide-vue-next'
import Draggable from 'vuedraggable'
import { useI18n } from 'vue-i18n'
import type { Route, Project } from '../../../shared/types'
import { PROJECT_STATUS } from '../../../shared/types'
import RouteItem from './RouteItem.vue'
import { useRouteGrouping } from '../composables/useRouteGrouping'

// --- 2. 類型定義 (Type Definitions) ---
interface Props {
  routes: Route[]
  isLoading: boolean
  currentProject?: Project
  selectedRouteId: string
}

// --- 3. 常量宣告 (Constants) ---
// None

// --- 4. 屬性與事件 (Props & Emits) ---
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'add'): void
  (e: 'delete', id: string): void
  (e: 'toggle-server'): void
  (e: 'open-docs'): void
  (e: 'reorder', groupName: string, newGroupRoutes: Route[]): void
}>()

const { t } = useI18n()

// --- 5. 響應式狀態 (State) ---
/** 路由列表搜尋關鍵字 */
const searchQuery = ref('')
/** 當前展開的群組名稱 (Accordion Only One) */
const expandedGroup = ref<string | null>(null)

// --- 6. 計算屬性 (Computed Properties) ---
const { filteredRoutes, groupedRoutes } = useRouteGrouping(toRef(props, 'routes'), searchQuery)

/**
 * 伺服器是否運行中
 */
const isServerRunning = computed(() => props.currentProject?.status === PROJECT_STATUS.RUNNING)

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 切換群組收合狀態 (Accordion)
 */
const toggleGroup = (groupName: string): void => {
  if (expandedGroup.value === groupName) {
    expandedGroup.value = null // Close if clicking same
  } else {
    expandedGroup.value = groupName // Open new, closes others
  }
}

const handleGroupReorder = (groupName: string, val: Route[]): void => {
  emit('reorder', groupName, val)
}
</script>

<template>
  <aside class="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900/30">
    <!-- Server Control -->
    <div v-if="currentProject" class="flex flex-col border-b border-zinc-800 bg-zinc-900/50 p-3">
      <div class="mb-2 flex items-center justify-between">
        <h2 class="truncate text-sm font-bold text-zinc-100" :title="currentProject.name">
          {{ currentProject.name }}
          <span class="ml-2 text-xs font-normal text-zinc-500"
            >v{{ currentProject.version || '1.0.0' }}</span
          >
        </h2>
        <button
          v-if="currentProject?.port"
          type="button"
          :class="
            isServerRunning ? 'cursor-pointer hover:bg-zinc-700 hover:text-zinc-200' : 'opacity-50'
          "
          class="ml-2 flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400"
          :title="t('project.open_docs') + ` (Port: ${currentProject.port})`"
          :disabled="!isServerRunning"
          @click.stop="emit('open-docs')"
        >
          <span class="min-w-10 text-[10px] font-medium">{{ t('project.docs') }}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
      </div>
      <button
        class="flex w-full cursor-pointer items-center justify-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition-colors"
        :class="
          isServerRunning
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
        "
        @click="emit('toggle-server')"
      >
        <component :is="isServerRunning ? Square : Play" :size="12" class="fill-current" />
        {{ isServerRunning ? t('project.stop_server') : t('project.start_server') }}
      </button>
    </div>

    <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <h3 class="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
        {{ t('common.route') }}
      </h3>

      <div class="flex items-center gap-2">
        <span class="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
          {{ routes.length }}
        </span>

        <button
          class="flex cursor-pointer items-center justify-center rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          :aria-label="t('route.new_route')"
          @click="emit('add')"
        >
          <Plus :size="14" />
        </button>
      </div>
    </div>

    <!-- Search Box -->
    <div class="p-2 pb-0">
      <div class="group relative">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('route.search_placeholder')"
          class="w-full rounded border border-zinc-800 bg-zinc-950/50 py-1.5 pr-2 pl-8 text-xs text-zinc-300 placeholder-zinc-600 transition-colors focus:border-zinc-700 focus:outline-none"
        />
        <Search
          :size="12"
          class="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-zinc-400"
        />
      </div>
    </div>

    <div class="flex-1 space-y-1 overflow-y-auto p-2">
      <div v-if="isLoading" class="flex h-32 items-center justify-center">
        <div
          class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
        />
      </div>

      <div
        v-else-if="filteredRoutes.length === 0"
        class="flex h-32 flex-col items-center justify-center space-y-2 px-4 text-center"
      >
        <p v-if="routes.length === 0" class="text-xs text-zinc-600 italic">
          {{ t('route.no_routes') }}
        </p>
        <p v-else class="text-xs text-zinc-600 italic">{{ t('route.no_match') }}</p>
      </div>

      <template v-else>
        <!-- Search Mode: Flat List -->
        <template v-if="searchQuery">
          <RouteItem
            v-for="item in filteredRoutes"
            :key="item.id"
            :method="item.method"
            :path="item.path"
            :is-selected="selectedRouteId === item.id"
            :is-enabled="item.isActive"
            @click="emit('select', item.id)"
            @delete="emit('delete', item.id)"
          />
        </template>

        <!-- Standard Mode: Grouped Accordion with Drag & Drop -->
        <template v-else>
          <template v-for="group in groupedRoutes" :key="group.name">
            <!-- Group Header -->
            <div
              v-if="group.name !== 'Ungrouped' || group.routes.length > 0"
              class="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              @click="toggleGroup(group.name)"
            >
              <div class="flex items-center gap-1.5">
                <component
                  :is="expandedGroup === group.name ? ChevronDown : ChevronRight"
                  :size="12"
                />
                <span :class="group.name === 'Ungrouped' ? 'italic opacity-70' : ''">
                  {{ group.name === 'Ungrouped' ? t('common.group') + ' (None)' : group.name }}
                </span>
              </div>
              <span class="text-[10px] text-zinc-600">{{ group.routes.length }}</span>
            </div>

            <!-- Routes List (Draggable) -->
            <div v-show="expandedGroup === group.name" class="pl-2">
              <Draggable
                :model-value="group.routes"
                item-key="id"
                :animation="200"
                ghost-class="ghost"
                class="flex flex-col space-y-1"
                @update:model-value="(val) => handleGroupReorder(group.name, val)"
              >
                <template #item="{ element }">
                  <RouteItem
                    :method="element.method"
                    :path="element.path"
                    :is-selected="selectedRouteId === element.id"
                    :is-enabled="element.isActive"
                    @click="emit('select', element.id)"
                    @delete="emit('delete', element.id)"
                  />
                </template>
              </Draggable>
            </div>
          </template>
        </template>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background-color: #27272a; /* zinc-800 */
}
</style>
