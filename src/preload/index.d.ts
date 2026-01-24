import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      windowControls: {
        minimize: () => void
        maximize: () => void
        close: () => void
      }
      db: {
        getProjects: () => Promise<Project[]>
        addProject: (
          project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>
        ) => Promise<Project>
        deleteProject: (id: string) => Promise<boolean>
      }
    }
  }
}

export interface Project {
  id: string
  name: string
  description?: string
  port: number
  createdAt: string
  updatedAt: string
  status: 'stopped' | 'running'
}
