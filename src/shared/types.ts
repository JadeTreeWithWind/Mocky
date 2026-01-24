// --- 1. 外部引用 (Imports) ---
import { z } from 'zod'

// --- 3. 常量宣告 (Constants) ---
export const PROJECT_STATUS = {
  STOPPED: 'stopped',
  RUNNING: 'running'
} as const

export const HTTP_METHODS = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])

// --- 2. 類型定義 (Schema Definitions) ---
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  port: z.number().int().min(1).max(65535),
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum([PROJECT_STATUS.STOPPED, PROJECT_STATUS.RUNNING]).default(PROJECT_STATUS.STOPPED)
})

export const RouteSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  method: HTTP_METHODS,
  path: z.string().startsWith('/'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  response: z.object({
    statusCode: z.number().int(),
    body: z.string(),
    delay: z.number().int().default(0)
  })
})

export const DBSchema = z.object({
  projects: z.array(ProjectSchema),
  routes: z.array(RouteSchema)
})

// --- 2. 類型匯出 (Type Exports) ---
export type Project = z.infer<typeof ProjectSchema>
export type Route = z.infer<typeof RouteSchema>
export type DBSchemaType = z.infer<typeof DBSchema>
