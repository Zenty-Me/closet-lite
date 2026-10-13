export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return formatDate(new Date())
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** month is 1-12; returns weekday of 1st (0=Sun) */
export function firstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

export const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
