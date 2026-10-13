import type { ClothingItem, WearLog } from '../types'

export interface ItemWearStat {
  item: ClothingItem
  count: number
  lastWorn: string | null // YYYY-MM-DD
}

/** Aggregate wear counts from logs (each log day counts once per item). */
export function buildWearCounts(logs: WearLog[]): Map<string, { count: number; lastWorn: string }> {
  const map = new Map<string, { count: number; lastWorn: string }>()
  for (const log of logs) {
    const seen = new Set(log.itemIds)
    for (const id of seen) {
      const prev = map.get(id)
      if (!prev) {
        map.set(id, { count: 1, lastWorn: log.date })
      } else {
        map.set(id, {
          count: prev.count + 1,
          lastWorn: log.date > prev.lastWorn ? log.date : prev.lastWorn,
        })
      }
    }
  }
  return map
}

export function rankItemsByWear(
  items: ClothingItem[],
  logs: WearLog[],
): { top: ItemWearStat[]; forgotten: ItemWearStat[]; all: ItemWearStat[] } {
  const counts = buildWearCounts(logs)
  const all: ItemWearStat[] = items.map((item) => {
    const c = counts.get(item.id)
    return {
      item,
      count: c?.count ?? 0,
      lastWorn: c?.lastWorn ?? null,
    }
  })

  const worn = all.filter((s) => s.count > 0).sort((a, b) => b.count - a.count || (b.lastWorn ?? '').localeCompare(a.lastWorn ?? ''))
  const forgotten = all
    .filter((s) => s.count === 0)
    .sort((a, b) => a.item.createdAt - b.item.createdAt)
  // also include rarely worn (1 time) after never-worn if we need more — keep separate
  const rare = all
    .filter((s) => s.count > 0 && s.count <= 1)
    .sort((a, b) => (a.lastWorn ?? '').localeCompare(b.lastWorn ?? ''))

  return {
    top: worn.slice(0, 5),
    forgotten: [...forgotten, ...rare.filter((r) => !forgotten.some((f) => f.item.id === r.item.id))].slice(0, 8),
    all,
  }
}
