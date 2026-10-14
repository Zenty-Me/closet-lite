/**
 * Monthly usage quotas for free tier (cutout + smart outfit).
 * Counters live in IndexedDB; Pro (`settings.isPro`) bypasses limits.
 */
import { getQuotaRecord, putQuotaRecord, type QuotaRecord } from '../db'
import { loadSettings } from './settings'

export const FREE_CUTOUT_PER_MONTH = 5
export const FREE_OUTFIT_PER_MONTH = 3

export type QuotaKind = 'cutout' | 'outfit'

export type QuotaStatus = {
  isPro: boolean
  month: string
  cutoutUsed: number
  outfitUsed: number
  cutoutLimit: number
  outfitLimit: number
  cutoutLeft: number
  outfitLeft: number
  cutoutUnlimited: boolean
  outfitUnlimited: boolean
}

function calendarMonth(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function emptyRecord(month: string): QuotaRecord {
  return {
    key: 'usageQuota',
    month,
    cutoutUsed: 0,
    outfitUsed: 0,
  }
}

async function loadCurrent(): Promise<QuotaRecord> {
  const month = calendarMonth()
  const existing = await getQuotaRecord()
  if (!existing || existing.month !== month) {
    const fresh = emptyRecord(month)
    await putQuotaRecord(fresh)
    return fresh
  }
  return existing
}

export function isProUser(): boolean {
  return Boolean(loadSettings().isPro)
}

export async function getQuotaStatus(): Promise<QuotaStatus> {
  const rec = await loadCurrent()
  const isPro = isProUser()
  const cutoutLimit = FREE_CUTOUT_PER_MONTH
  const outfitLimit = FREE_OUTFIT_PER_MONTH
  return {
    isPro,
    month: rec.month,
    cutoutUsed: rec.cutoutUsed,
    outfitUsed: rec.outfitUsed,
    cutoutLimit,
    outfitLimit,
    cutoutLeft: isPro ? Infinity : Math.max(0, cutoutLimit - rec.cutoutUsed),
    outfitLeft: isPro ? Infinity : Math.max(0, outfitLimit - rec.outfitUsed),
    cutoutUnlimited: isPro,
    outfitUnlimited: isPro,
  }
}

export async function canUse(kind: QuotaKind): Promise<{
  ok: boolean
  status: QuotaStatus
}> {
  const status = await getQuotaStatus()
  if (status.isPro) return { ok: true, status }
  const ok = kind === 'cutout' ? status.cutoutUsed < status.cutoutLimit : status.outfitUsed < status.outfitLimit
  return { ok, status }
}

/** Consume one use after a successful action. No-op for Pro. */
export async function consumeQuota(kind: QuotaKind): Promise<QuotaStatus> {
  if (isProUser()) return getQuotaStatus()
  const rec = await loadCurrent()
  if (kind === 'cutout') rec.cutoutUsed += 1
  else rec.outfitUsed += 1
  await putQuotaRecord(rec)
  return getQuotaStatus()
}

/** Test helper — does not bypass Pro */
export async function resetQuotaForTests(): Promise<void> {
  await putQuotaRecord(emptyRecord(calendarMonth()))
}
