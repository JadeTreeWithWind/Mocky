// --- 1. 外部引用 (Imports) ---
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

// --- 3. 常量宣告 (Constants) ---

/**
 * 應用程式路由配置表
 * - 使用懶加載 (Lazy Loading) 以優化首屏載入效能
 * - 使用 Hash History 模式以相容 Electron 環境
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'welcome',
    component: () => import('../views/WelcomeView.vue')
  },
  {
    path: '/project/:id',
    name: 'project-detail',
    component: () => import('../views/ProjectDetailView.vue')
  }
]

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// --- 10. 對外暴露 (Exports) ---
export default router
