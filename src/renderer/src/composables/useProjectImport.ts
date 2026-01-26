import { useI18n } from 'vue-i18n'
import { useProjectStore } from '../stores/project'
import { useUIStore } from '../stores/ui'

export function useProjectImport(): {
  importProjectFromFile: () => Promise<string | undefined>
} {
  const { t } = useI18n()
  const projectStore = useProjectStore()
  const uiStore = useUIStore()

  /**
   * Import project from file
   * @returns Imported Project ID or undefined if failed/cancelled
   */
  const importProjectFromFile = async (): Promise<string | undefined> => {
    try {
      const content = await window.api.project.import()
      if (!content) return undefined

      // Postman Compatibility Check
      try {
        const json = JSON.parse(content)
        if (json.info?.schema?.includes('getpostman.com')) {
          throw new Error('POSTMAN_FORMAT_NOT_SUPPORTED')
        }
      } catch (e: unknown) {
        // Safe check for message property
        if (e instanceof Error && e.message === 'POSTMAN_FORMAT_NOT_SUPPORTED') {
          throw e
        }
        // Ignore other JSON parse errors, let the store handle validation
      }

      const newProjectId = await projectStore.importProject(content)
      uiStore.showToast(t('project.import_success'), 'success')
      return newProjectId
    } catch (error: unknown) {
      console.error('[Project] Import failed:', error)

      const msg = error instanceof Error ? error.message : String(error)

      if (msg === 'POSTMAN_FORMAT_NOT_SUPPORTED' || msg.includes('POSTMAN_FORMAT_NOT_SUPPORTED')) {
        throw new Error(
          'Postman Collection format is not currently supported. Please convert it to OpenAPI/Swagger format first.'
        )
      }

      // Return error for UI to display (or throw)
      throw new Error(msg)
    }
  }

  return {
    importProjectFromFile
  }
}
