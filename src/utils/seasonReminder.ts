import type { SeasonFilter } from '../types'
import { currentSeason } from './suggest'
import type { AppSettings } from './settings'

const MONTH_HINT: Record<number, string> = {
  3: '春季将至，可整理冬装、准备春装',
  4: '正值换季，检查春秋单品是否够用',
  5: '入夏前可收纳厚外套',
  6: '夏季模式，厚外套可标为收纳中',
  9: '入秋换季，可翻出外套与长袖',
  10: '秋冬过渡，检查保暖单品',
  11: '入冬提醒，厚外套与毛衣准备好了吗',
}

export function seasonReminderMessage(settings: AppSettings, date = new Date()): string | null {
  if (!settings.seasonReminder) return null
  const month = date.getMonth() + 1
  const natural = currentSeason(date)
  if (settings.seasonMode && settings.currentSeasonFilter !== natural) {
    return `当前更像「${natural}」，衣橱季节筛选仍是「${settings.currentSeasonFilter}」。可在「我的」调整。`
  }
  const hint = MONTH_HINT[month]
  if (hint && (!settings.seasonMode || settings.currentSeasonFilter === natural)) {
    // only show month hint once-ish via localStorage day key optional — keep simple always when month in map
    return hint
  }
  return null
}

export type { SeasonFilter }
