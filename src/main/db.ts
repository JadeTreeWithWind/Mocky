import { app } from 'electron'
import { join } from 'path'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import type { Low } from 'lowdb'

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  port: z.number().int().min(1).max(65535),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum(['stopped', 'running']).default('stopped')
})

export type Project = z.infer<typeof ProjectSchema>

export const RouteSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']),
  path: z.string().startsWith('/'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  response: z.object({
    statusCode: z.number().int(),
    body: z.string(), // Storing as string to allow flexible editing
    delay: z.number().int().default(0)
  })
})

export type Route = z.infer<typeof RouteSchema>

export const DBSchema = z.object({
  projects: z.array(ProjectSchema),
  routes: z.array(RouteSchema)
})

export type DBSchemaType = z.infer<typeof DBSchema>

class DBService {
  private db: Low<DBSchemaType> | null = null
  private dbPath: string = ''

  constructor() {
    // path resolution deferred to init
  }

  async init(): Promise<void> {
    if (this.db) return

    // Ensure we are getting the path after app is ready effectively,
    // or at least when init is called (which we will do in handlers)
    if (!this.dbPath) {
      this.dbPath = join(app.getPath('userData'), 'db.json')
    }

    try {
      // Dynamic import for ESM compatibility in likely CJS environment
      const { JSONFilePreset } = await import('lowdb/node')
      const defaultData: DBSchemaType = { projects: [], routes: [] }
      this.db = await JSONFilePreset(this.dbPath, defaultData)

      // Migration: Ensure routes exists if the file was created by an older version
      if (!this.db.data.routes) {
        this.db.data.routes = []
        await this.db.write()
        console.log('Migrated DB: added missing routes array')
      }

      console.log('DB initialized at:', this.dbPath)
    } catch (error) {
      console.error('Failed to init DB:', error)
      throw error
    }
  }

  async getProjects(): Promise<Project[]> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')
    await this.db.read()
    console.log('[DB] Projects loaded:', this.db.data.projects)
    return this.db.data.projects
  }

  async addProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Project> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')

    const newProject: Project = {
      ...project,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'stopped'
    }

    await this.db.update(({ projects }: DBSchemaType) => projects.push(newProject))
    return newProject
  }

  async deleteProject(id: string): Promise<boolean> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')
    const initialLength = this.db.data.projects.length

    // Also delete associated routes
    await this.db.update((data: DBSchemaType) => {
      const index = data.projects.findIndex((p) => p.id === id)
      if (index !== -1) {
        data.projects.splice(index, 1)
        // Filter out routes belonging to this project
        if (data.routes) {
          data.routes = data.routes.filter((r) => r.projectId !== id)
        }
      }
    })
    return this.db.data.projects.length < initialLength
  }

  async getRoutesByProjectId(projectId: string): Promise<Route[]> {
    await this.init()
    if (!this.db) throw new Error('DB not initialized')
    await this.db.read()
    const routes = (this.db.data.routes || []).filter((r) => r.projectId === projectId)
    console.log(`[DB] Routes loaded for project ${projectId}:`, routes)
    return routes
  }
}

export const dbService = new DBService()
