// --- 1. 外部引用 (Imports) ---
import { createRouter, createWebHashHistory } from 'vue-router'
import WelcomeView from '../views/WelcomeView.vue'
import ProjectDetailView from '../views/ProjectDetailView.vue'

// --- 7. 核心邏輯與函數 (Functions/Methods) ---

/**
 * 應用程式路由配置
 * - 使用 Hash History 模式以相容 Electron 環境
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomeView
    },
    {
      path: '/project/:id',
      name: 'project-detail',
      component: ProjectDetailView
    }
  ]
})

// --- 10. 對外暴露 (Exports) ---
export default router
