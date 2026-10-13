import type { Category, ClothingItem, WishlistItem } from '../types'
import { CATEGORIES, CATEGORY_LABEL } from '../types'

export interface CategoryValueRow {
  category: Category
  label: string
  count: number
  total: number
  pricedCount: number
}

export interface WardrobeValueSummary {
  itemCount: number
  pricedCount: number
  totalValue: number
  avgPrice: number
  byCategory: CategoryValueRow[]
}

export function summarizeWardrobeValue(
  items: ClothingItem[],
  opts?: { includeRetired?: boolean },
): WardrobeValueSummary {
  const includeRetired = Boolean(opts?.includeRetired)
  const list = includeRetired ? items : items.filter((i) => i.status !== '已淘汰')
  let totalValue = 0
  let pricedCount = 0
  const map = new Map<Category, { count: number; total: number; pricedCount: number }>()
  for (const c of CATEGORIES) map.set(c, { count: 0, total: 0, pricedCount: 0 })
  for (const it of list) {
    const row = map.get(it.category) ?? { count: 0, total: 0, pricedCount: 0 }
    row.count++
    if (it.price != null && !Number.isNaN(it.price) && it.price > 0) {
      row.total += it.price
      row.pricedCount++
      totalValue += it.price
      pricedCount++
    }
    map.set(it.category, row)
  }
  const byCategory: CategoryValueRow[] = CATEGORIES.map((c) => {
    const r = map.get(c)!
    return {
      category: c,
      label: CATEGORY_LABEL[c],
      count: r.count,
      total: r.total,
      pricedCount: r.pricedCount,
    }
  }).filter((r) => r.count > 0)

  return {
    itemCount: list.length,
    pricedCount,
    totalValue,
    avgPrice: pricedCount ? totalValue / pricedCount : 0,
    byCategory,
  }
}

/** Parse rough number from wishlist priceNote like "约 ¥599" */
export function parsePriceNote(note: string): number | null {
  const m = note.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

export function summarizeWishlistValue(list: WishlistItem[]): { openCount: number; openEstimate: number } {
  let openCount = 0
  let openEstimate = 0
  for (const w of list) {
    if (w.bought) continue
    openCount++
    const n = parsePriceNote(w.priceNote)
    if (n != null) openEstimate += n
  }
  return { openCount, openEstimate }
}

export function formatYuan(n: number): string {
  if (!Number.isFinite(n)) return '¥0'
  const rounded = Math.round(n * 100) / 100
  return `¥${rounded.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
}
