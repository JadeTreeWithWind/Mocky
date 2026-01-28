export const HTTP_STATUS_CODES = [
  { code: 200, label: 'OK' },
  { code: 201, label: 'Created' },
  { code: 202, label: 'Accepted' },
  { code: 204, label: 'No Content' },
  { code: 301, label: 'Moved Permanently' },
  { code: 302, label: 'Found' },
  { code: 304, label: 'Not Modified' },
  { code: 400, label: 'Bad Request' },
  { code: 401, label: 'Unauthorized' },
  { code: 403, label: 'Forbidden' },
  { code: 404, label: 'Not Found' },
  { code: 405, label: 'Method Not Allowed' },
  { code: 422, label: 'Unprocessable Entity' },
  { code: 429, label: 'Too Many Requests' },
  { code: 500, label: 'Internal Server Error' },
  { code: 502, label: 'Bad Gateway' },
  { code: 503, label: 'Service Unavailable' }
] as const

export const METHOD_THEMES: Record<string, string> = {
  GET: 'text-blue-400 border-blue-500/50 bg-blue-500/10 focus:border-blue-500 focus:ring-blue-500/30',
  POST: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10 focus:border-yellow-500 focus:ring-yellow-500/30',
  PUT: 'text-orange-400 border-orange-500/50 bg-orange-500/10 focus:border-orange-500 focus:ring-orange-500/30',
  DELETE: 'text-red-400 border-red-500/50 bg-red-500/10 focus:border-red-500 focus:ring-red-500/30',
  PATCH:
    'text-green-400 border-green-500/50 bg-green-500/10 focus:border-green-500 focus:ring-green-500/30',
  OPTIONS:
    'text-purple-400 border-purple-500/50 bg-purple-500/10 focus:border-purple-500 focus:ring-purple-500/30',
  HEAD: 'text-teal-400 border-teal-500/50 bg-teal-500/10 focus:border-teal-500 focus:ring-teal-500/30'
} as const

// RouteItem uses slightly different classes (no focus rings, etc), maybe we should consolidate or keep separate?
// RouteEditor: text-blue-400 border-blue-500/50 bg-blue-500/10 ...
// RouteItem: text-blue-400 bg-blue-500/10 border-blue-500/20
// The colors are the same, but the specific Tailwind utilities differ slightly for context.
// Let's keep a BASE theme map or just specialized ones.
// For now, I will export the Badge themes for RouteItem as well.

export const METHOD_BADGE_THEMES: Record<string, string> = {
  GET: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  POST: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  PUT: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  DELETE: 'text-red-400 bg-red-500/10 border-red-500/20',
  PATCH: 'text-green-400 bg-green-500/10 border-green-500/20'
} as const

export const DEFAULT_BADGE_THEME = 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'

export const SAVE_STATUS = {
  SAVED: 'saved',
  SAVING: 'saving',
  UNSAVED: 'unsaved'
} as const

export type SaveStatus = (typeof SAVE_STATUS)[keyof typeof SAVE_STATUS]

export const UNGROUPED_NAME = 'Ungrouped'
