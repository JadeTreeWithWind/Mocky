import { app } from 'electron'
import { join } from 'path'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'

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

export const DBSchema = z.object({
  projects: z.array(ProjectSchema)
})

export type DBSchemaType = z.infer<typeof DBSchema>

class DBService {
  private db: any = null
  private dbPath: string = ''

  constructor() {
    // path resolution deferred to init
  }

  async init() {
    if (this.db) return

    // Ensure we are getting the path after app is ready effectively,
    // or at least when init is called (which we will do in handlers)
    if (!this.dbPath) {
      this.dbPath = join(app.getPath('userData'), 'db.json')
    }

    try {
      // Dynamic import for ESM compatibility in likely CJS environment
      const { JSONFilePreset } = await import('lowdb/node')
      const defaultData: DBSchemaType = { projects: [] }
      this.db = await JSONFilePreset(this.dbPath, defaultData)
      console.log('DB initialized at:', this.dbPath)
    } catch (error) {
      console.error('Failed to init DB:', error)
      throw error
    }
  }

  async getProjects(): Promise<Project[]> {
    await this.init()
    await this.db.read()
    console.log('[DB] Projects loaded:', this.db.data.projects)
    return this.db.data.projects
  }

  async addProject(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<Project> {
    await this.init()

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
}

export const dbService = new DBService()
