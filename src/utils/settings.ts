import type { SeasonFilter } from '../types'
import { currentSeason } from './suggest'

const KEY = 'qing-yichu-settings'

export interface AppSettings {
  /** When true, wardrobe filters to 四季 + currentSeasonFilter */
  seasonMode: boolean
  currentSeasonFilter: SeasonFilter
}

function defaults(): AppSettings {
  return {
    seasonMode: false,
    currentSeasonFilter: currentSeason(),
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults()
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const base = defaults()
    return {
      seasonMode: Boolean(parsed.seasonMode),
      currentSeasonFilter:
        parsed.currentSeasonFilter && ['春', '夏', '秋', '冬'].includes(parsed.currentSeasonFilter)
          ? parsed.currentSeasonFilter
          : base.currentSeasonFilter,
    }
  } catch {
    return defaults()
  }
}

export function saveSettings(next: AppSettings): void {
  localStorage.setItem(KEY, JSON.stringify(next))
}
