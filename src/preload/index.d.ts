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
        getRoutesByProjectId: (projectId: string) => Promise<Route[]>
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

export interface Route {
  id: string
  projectId: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
  path: string
  description?: string
  isActive: boolean
  response: {
    statusCode: number
    body: string
    delay: number
  }
}
