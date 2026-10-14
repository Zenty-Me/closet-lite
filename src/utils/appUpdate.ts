import { APP_BUILD, APP_VERSION, APK_DOWNLOAD_URL, APP_VERSION_URL } from '../version'
import { isNativePlatform } from './cutout'

export interface RemoteAppVersion {
  version: string
  build?: number
  apkUrl?: string
  notes?: string
}

const CHECK_KEY = 'qing-yichu-update-checked'
const DAY_MS = 24 * 60 * 60 * 1000

export function getLocalVersion(): { version: string; build: number } {
  return { version: APP_VERSION, build: APP_BUILD }
}

function parseVer(v: string): number[] {
  return v
    .replace(/^v/i, '')
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0)
}

/** true if remote is newer than local */
export function isNewerVersion(remote: RemoteAppVersion): boolean {
  if (typeof remote.build === 'number' && remote.build > APP_BUILD) return true
  const a = parseVer(remote.version || '0')
  const b = parseVer(APP_VERSION)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

export async function fetchRemoteVersion(): Promise<RemoteAppVersion | null> {
  try {
    const res = await fetch(`${APP_VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = (await res.json()) as RemoteAppVersion
    if (!json?.version) return null
    return json
  } catch {
    return null
  }
}

export function shouldAutoCheck(): boolean {
  try {
    const last = Number(localStorage.getItem(CHECK_KEY) || 0)
    return !last || Date.now() - last > DAY_MS
  } catch {
    return true
  }
}

export function markAutoChecked(): void {
  try {
    localStorage.setItem(CHECK_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

export function apkUrlFor(remote?: RemoteAppVersion | null): string {
  return remote?.apkUrl?.trim() || APK_DOWNLOAD_URL
}

export function openUpdateAction(remote: RemoteAppVersion): void {
  if (isNativePlatform()) {
    window.location.href = apkUrlFor(remote)
    return
  }
  window.location.reload()
}

export { isNativePlatform }
