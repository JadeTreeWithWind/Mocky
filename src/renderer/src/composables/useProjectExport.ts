import { useI18n } from 'vue-i18n'
import { toOpenApi } from '../../../shared/utils/openapi-generator'
import { useProjectStore } from '../stores/project'
import { useUIStore } from '../stores/ui'

export function useProjectExport(): {
  exportProjectJson: (projectId: string) => Promise<void>
  exportProjectHtml: (projectId: string) => Promise<void>
} {
  const { t } = useI18n()
  const projectStore = useProjectStore()
  const uiStore = useUIStore()

  /**
   * Export project as OpenAPI JSON
   */
  const exportProjectJson = async (projectId: string): Promise<void> => {
    const project = projectStore.projects.find((p) => p.id === projectId)
    if (!project) return

    try {
      // Get all routes for the project
      // Note: We access window.api directly here as strictly typed in env.d.ts
      const routes = await window.api.db.getRoutesByProjectId(projectId)

      // Convert to OpenAPI format
      const openApiDoc = toOpenApi(project, routes)
      const jsonContent = JSON.stringify(openApiDoc, null, 2)

      // Call main process to download
      const filename = `${project.name.replace(/\s+/g, '_')}_openapi.json`
      const success = await window.api.project.export(jsonContent, filename)

      if (!success) {
        uiStore.showToast(t('project.export_failed'), 'error')
        return
      }
      console.log('Export successful')
      uiStore.showToast(t('project.export_success'), 'success')
    } catch (error) {
      console.error('[Project] Export failed:', error)
      uiStore.showToast(t('project.export_failed'), 'error')
    }
  }

  /**
   * Export project as HTML documentation
   */
  const exportProjectHtml = async (projectId: string): Promise<void> => {
    try {
      await projectStore.exportHtml(projectId)
      uiStore.showToast(t('project.export_success'), 'success')
    } catch (error) {
      console.error('[Project] Export HTML failed:', error)
      // Error handling is managed by the store/UI, but we can re-throw or handle here
      throw error
    }
  }

  return {
    exportProjectJson,
    exportProjectHtml
  }
}
