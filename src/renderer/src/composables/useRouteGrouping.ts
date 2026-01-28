import { computed, Ref, ComputedRef } from 'vue'
import type { Route } from '../../../shared/types'
import { UNGROUPED_NAME } from '../constants'

export function useRouteGrouping(
  routes: Ref<Route[]>,
  searchQuery: Ref<string>
): {
  filteredRoutes: ComputedRef<Route[]>
  groupedRoutes: ComputedRef<{ name: string; routes: Route[] }[]>
} {
  /**
   * Filter routes based on search query
   */
  const filteredRoutes = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return routes.value

    return routes.value.filter(
      (r) =>
        r.path.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
    )
  })

  /**
   * Group routes by tags
   */
  const groupedRoutes = computed(() => {
    const map = new Map<string, Route[]>()
    const ungrouped: Route[] = []
    const list = filteredRoutes.value

    list.forEach((r) => {
      if (!r.tags || r.tags.length === 0) {
        ungrouped.push(r)
      } else {
        r.tags.forEach((tag) => {
          if (!map.has(tag)) {
            map.set(tag, [])
          }
          map.get(tag)?.push(r)
        })
      }
    })

    // Convert map to array and sort
    const groups: { name: string; routes: Route[] }[] = []

    // Add Tags (sorted alphabetically)
    const sortedTags = Array.from(map.keys()).sort()
    sortedTags.forEach((tag) => {
      groups.push({ name: tag, routes: map.get(tag)! })
    })

    // Add Ungrouped at the end
    if (ungrouped.length > 0) {
      groups.push({ name: UNGROUPED_NAME, routes: ungrouped })
    }

    // Special case: if list is not empty but no groups formed (shouldn't happen with ungrouped logic, but safe fallback)
    // 若有篩選結果但未形成分組（邏輯上不應發生），確保仍回傳結果
    if (groups.length === 0 && list.length > 0) {
      return [{ name: UNGROUPED_NAME, routes: list }]
    }

    return groups
  })

  return {
    filteredRoutes,
    groupedRoutes
  }
}
