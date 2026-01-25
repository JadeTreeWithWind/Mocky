import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  url: string
}

export const useUIStore = defineStore('ui', () => {
  const toast = ref({
    visible: false,
    message: '',
    type: 'info' as ToastType,
    action: undefined as ToastAction | undefined
  })

  let timeoutId: NodeJS.Timeout | undefined

  const showToast = (message: string, type: ToastType = 'info', action?: ToastAction): void => {
    // Clear previous timeout if any
    if (timeoutId) clearTimeout(timeoutId)

    toast.value = {
      visible: true,
      message,
      type,
      action
    }

    timeoutId = setTimeout(() => {
      toast.value.visible = false
      toast.value.action = undefined // Clear action to avoid lingering state
    }, 4000)
  }

  const hideToast = (): void => {
    toast.value.visible = false
    if (timeoutId) clearTimeout(timeoutId)
  }

  return {
    toast,
    showToast,
    hideToast
  }
})
