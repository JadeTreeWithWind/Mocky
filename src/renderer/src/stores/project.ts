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
      // @ts-ignore - TS might complain about Project type mismatch between preload and usage here
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
      // @ts-ignore - TS might complain about addProject payload or return type mismatch
      const newProject = await window.api.db.addProject(payload)
      projects.value.push(newProject)
      return newProject
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  return {
    projects,
    fetchProjects,
    createProject
  }
})
