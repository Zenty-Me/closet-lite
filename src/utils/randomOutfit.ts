import type { Category, ClothingItem, SeasonFilter } from '../types'
import { itemFitsSeason } from './suggest'

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

const GROUPS: Category[][] = [['上衣'], ['裤子', '裙子'], ['鞋子'], ['外套'], ['包', '配饰']]

export function randomOutfit(
  items: ClothingItem[],
  season?: SeasonFilter | null,
): ClothingItem[] {
  const pool =
    season != null ? items.filter((i) => itemFitsSeason(i, season)) : [...items]
  if (pool.length === 0) return []

  const picked: ClothingItem[] = []
  const used = new Set<string>()

  for (const cats of GROUPS) {
    const candidates = pool.filter((i) => cats.includes(i.category) && !used.has(i.id))
    const choice = pickRandom(candidates)
    if (choice) {
      picked.push(choice)
      used.add(choice.id)
    }
  }

  // Need at least top + bottom-ish or any 2
  if (picked.length < 2) {
    const rest = pool.filter((i) => !used.has(i.id))
    while (picked.length < Math.min(3, pool.length) && rest.length) {
      const idx = Math.floor(Math.random() * rest.length)
      const [it] = rest.splice(idx, 1)
      picked.push(it)
    }
  }

  return picked
}
