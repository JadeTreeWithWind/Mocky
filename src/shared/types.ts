// --- 1. 外部引用 (Imports) ---
import { z } from 'zod'

// --- 2. 類型定義 (Type Definitions) ---
// ※ Zod Schema 在這裡定義，作為型別與驗證的 Single Source of Truth

// --- 3. 常量宣告 (Constants) ---
export const PROJECT_STATUS = {
  STOPPED: 'stopped',
  RUNNING: 'running'
} as const

export const HTTP_METHODS = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])

// --- 4. Schema Definitions ---
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  port: z.number().int().min(1).max(65535),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string().default('1.0.0'),
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
  }),
  tags: z.array(z.string()).default([])
})

export const DBSchema = z.object({
  projects: z.array(ProjectSchema),
  routes: z.array(RouteSchema)
})

// --- 10. 對外暴露 (Exports) ---
export type Project = z.infer<typeof ProjectSchema>
export type Route = z.infer<typeof RouteSchema>
export type DBSchemaType = z.infer<typeof DBSchema>
