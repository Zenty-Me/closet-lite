import type { Category, ClothingItem, Season } from '../types'
import { itemHasSeason } from './seasons'

/** Northern-hemisphere-ish mapping for CN users. */
export function seasonFromMonth(month: number): Exclude<Season, '四季'> {
  if (month >= 3 && month <= 5) return '春'
  if (month >= 6 && month <= 8) return '夏'
  if (month >= 9 && month <= 11) return '秋'
  return '冬'
}

export function currentSeason(date = new Date()): Exclude<Season, '四季'> {
  return seasonFromMonth(date.getMonth() + 1)
}

export function itemFitsSeason(item: ClothingItem, season: Season): boolean {
  return itemHasSeason(item, season)
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Prefer one piece per key category for a simple daily look. */
const SUGGEST_ORDER: Category[][] = [
  ['上衣'],
  ['裤子', '裙子'],
  ['外套'],
  ['鞋子'],
  ['包', '配饰'],
]

export function suggestTodayOutfit(
  items: ClothingItem[],
  season: Exclude<Season, '四季'> = currentSeason(),
): ClothingItem[] {
  const pool = items.filter((i) => itemFitsSeason(i, season))
  if (pool.length === 0) return []

  const picked: ClothingItem[] = []
  const used = new Set<string>()

  for (const cats of SUGGEST_ORDER) {
    const candidates = pool.filter((i) => cats.includes(i.category) && !used.has(i.id))
    const choice = pickRandom(candidates)
    if (choice) {
      picked.push(choice)
      used.add(choice.id)
    }
  }

  // If too thin (e.g. only tops), fill with more seasonal randoms up to 4
  if (picked.length < 2) {
    const rest = pool.filter((i) => !used.has(i.id))
    while (picked.length < Math.min(4, pool.length) && rest.length > 0) {
      const idx = Math.floor(Math.random() * rest.length)
      const [item] = rest.splice(idx, 1)
      picked.push(item)
      used.add(item.id)
    }
  }

  return picked
}
