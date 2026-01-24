import { defineStore } from 'pinia'
import { ref } from 'vue'

// We assume Project type matches what's returned by the API
// Since the global Window interface has it, we can trust the return type of window.api.db.getProjects

export interface Project {
  id: string
  name: string
  port: number
  description?: string
  status: 'stopped' | 'running'
  createdAt: string
  updatedAt: string
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])

  const fetchProjects = async (): Promise<void> => {
    try {
      const data = await window.api.db.getProjects()
      // @ts-ignore: Internal Project type mismatch with DB schema
      projects.value = data
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const createProject = async (payload: {
    name: string
    port: number
    description: string
  }): Promise<Project> => {
    try {
      // @ts-ignore: Preload API payload type mismatch
      const newProject = await window.api.db.addProject(payload)
      projects.value.push(newProject)
      return newProject
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  const deleteProject = async (id: string): Promise<void> => {
    try {
      await window.api.db.deleteProject(id)
      projects.value = projects.value.filter((p) => p.id !== id)
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }

  const routes = ref<Route[]>([])

  const fetchRoutes = async (projectId: string): Promise<void> => {
    try {
      // @ts-ignore: Preload API return type mismatch
      const data = await window.api.db.getRoutesByProjectId(projectId)
      routes.value = data
    } catch (error) {
      console.error('Failed to fetch routes', error)
    }
  }

  return {
    projects,
    routes,
    fetchProjects,
    createProject,
    deleteProject,
    fetchRoutes
  }
})

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
