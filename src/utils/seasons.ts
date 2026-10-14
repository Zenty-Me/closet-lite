import { SEASONS, type ClothingItem, type Season } from '../types'

export function isSeason(v: unknown): v is Season {
  return typeof v === 'string' && (SEASONS as readonly string[]).includes(v)
}

/**
 * Normalize seasons array. Legacy `season` string → [season].
 * Rule: 「四季」 alone means all-season; if mixed with others, prefer specific seasons only
 * unless the only value is 四季.
 */
export function normalizeSeasons(
  seasonsRaw: unknown,
  legacySeason?: unknown,
): Season[] {
  if (Array.isArray(seasonsRaw)) {
    const cleaned = seasonsRaw.filter(isSeason)
    if (cleaned.length === 0) {
      /* fall through */
    } else if (cleaned.includes('四季')) {
      // If only 四季, or 四季 plus others from bad data → store 四季 alone when 四季 selected
      // Prefer: if any non-四季, drop 四季
      const specific = cleaned.filter((s) => s !== '四季')
      return specific.length > 0 ? specific : ['四季']
    } else {
      return cleaned
    }
  }
  if (isSeason(legacySeason)) return [legacySeason]
  return ['四季']
}

export function formatSeasons(seasons: Season[]): string {
  if (!seasons?.length) return '四季'
  return seasons.join('、')
}

/**
 * Multi-toggle rule:
 * - Tap 「四季」 → only ['四季']
 * - Tap 春/夏/秋/冬 → remove 四季, toggle that season; empty → ['四季']
 */
export function toggleSeason(current: Season[], tapped: Season): Season[] {
  if (tapped === '四季') return ['四季']
  const withoutAll = current.filter((s) => s !== '四季')
  if (withoutAll.includes(tapped)) {
    const next = withoutAll.filter((s) => s !== tapped)
    return next.length ? next : ['四季']
  }
  return [...withoutAll, tapped]
}

export function itemHasSeason(item: ClothingItem, filter: Season): boolean {
  const ss = item.seasons?.length ? item.seasons : normalizeSeasons(undefined, (item as { season?: Season }).season)
  return ss.includes('四季') || ss.includes(filter)
}
