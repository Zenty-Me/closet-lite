import type { Category, ClothingItem, ColorName, Season, SeasonFilter } from '../types'

export type SortKey = 'created' | 'updated' | 'wear' | 'name'

export interface WardrobeQuery {
  search: string
  category: Category | '全部'
  color: ColorName | '全部'
  season: Season | '全部'
  sort: SortKey
  seasonMode: boolean
  currentSeasonFilter: SeasonFilter
  wearCounts: Map<string, number>
}

export function filterAndSortItems(
  items: ClothingItem[],
  q: WardrobeQuery,
): ClothingItem[] {
  const needle = q.search.trim().toLowerCase()

  let list = items.filter((item) => {
    if (q.seasonMode) {
      if (item.season !== '四季' && item.season !== q.currentSeasonFilter) return false
    }
    if (q.category !== '全部' && item.category !== q.category) return false
    if (q.color !== '全部' && item.color !== q.color) return false
    if (q.season !== '全部' && item.season !== q.season) return false
    if (needle) {
      const hay = [
        item.name,
        item.brand,
        item.notes,
        item.location,
        item.size,
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })

  list = [...list]
  switch (q.sort) {
    case 'updated':
      list.sort((a, b) => b.updatedAt - a.updatedAt)
      break
    case 'wear':
      list.sort(
        (a, b) => (q.wearCounts.get(b.id) ?? 0) - (q.wearCounts.get(a.id) ?? 0),
      )
      break
    case 'name':
      list.sort((a, b) =>
        (a.name || a.category).localeCompare(b.name || b.category, 'zh'),
      )
      break
    case 'created':
    default:
      list.sort((a, b) => b.createdAt - a.createdAt)
      break
  }

  return list
}
