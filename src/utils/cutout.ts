/**
 * In-browser background removal via @imgly/background-removal (npm).
 * Model/WASM load from same-origin `${BASE_URL}bg-removal/` (isnet_quint8).
 * Native Capacitor: local assets only (no CDN). Web: CDN data fallback if local missing.
 *
 * Capacitor Android note: WebViewLocalServer html5mode returns index.html for any
 * path whose last segment has no `.`. Chunk files must use a dotted name (e.g. `.bin`).
 */

import { removeBackground } from '@imgly/background-removal'
import { Capacitor } from '@capacitor/core'

const PKG = '1.7.0'
const CDN_DATA = `https://staticimgly.com/@imgly/background-removal-data/${PKG}/dist/`

let resolvedPublicPath: string | null = null

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        ?.isNativePlatform?.(),
    )
  }
}

/** Absolute URL so Capacitor https://localhost WebView resolves correctly. */
function localPublicPathAbs(): string {
  // Native APK is always built with VITE_BASE=/; never use Pages `/qing-yichu/`.
  const base = isNativePlatform() ? '/' : import.meta.env.BASE_URL || '/'
  const path = `${base.endsWith('/') ? base : `${base}/`}bg-removal/`
  return new URL(path, window.location.origin).href
}

function looksLikeHtml(bytes: Uint8Array): boolean {
  if (bytes.length < 9) return false
  const head = new TextDecoder().decode(bytes.slice(0, 64)).toLowerCase().trimStart()
  return head.startsWith('<!doctype') || head.startsWith('<html')
}

async function probeLocal(): Promise<string | null> {
  const path = localPublicPathAbs()
  try {
    const res = await fetch(new URL('resources.json', path).href, {
      method: 'GET',
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as Record<
      string,
      { chunks?: Array<{ name: string }> } | undefined
    >
    const model = json['/models/isnet_quint8']
    if (!model) return null
    const first = model.chunks?.[0]?.name
    if (!first) return null
    // Extensionless names are SPA-captured on Capacitor Android — treat as missing.
    if (!first.includes('.')) return null

    // Prefer Range so we do not pull a 4MB chunk just to probe. Capacitor supports Range.
    // Fall back to a small GET if Range is rejected.
    let chunkRes = await fetch(new URL(first, path).href, {
      method: 'GET',
      cache: 'no-store',
      headers: { Range: 'bytes=0-63' },
    })
    if (!chunkRes.ok && chunkRes.status !== 206) {
      chunkRes = await fetch(new URL(first, path).href, {
        method: 'GET',
        cache: 'no-store',
      })
      if (!chunkRes.ok) return null
    }
    const buf = new Uint8Array(await chunkRes.arrayBuffer())
    if (buf.length === 0 || looksLikeHtml(buf)) return null
    return path.endsWith('/') ? path : `${path}/`
  } catch {
    return null
  }
}

async function resolvePublicPath(): Promise<string> {
  if (resolvedPublicPath) return resolvedPublicPath
  const local = await probeLocal()
  if (local) {
    resolvedPublicPath = local
    return local
  }
  if (isNativePlatform()) {
    throw new Error('NATIVE_MISSING_ASSETS')
  }
  resolvedPublicPath = CDN_DATA
  return CDN_DATA
}

export async function removeImageBackground(blob: Blob): Promise<Blob> {
  const publicPath = await resolvePublicPath()
  return removeBackground(blob, {
    publicPath,
    model: 'isnet_quint8',
    output: { format: 'image/png', quality: 0.9 },
  })
}

/** Human-readable cutout error for UI */
export function cutoutErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  if (msg === 'NATIVE_MISSING_ASSETS') {
    return '去背景失败：包内模型未找到。请重新安装最新版 APK。'
  }
  if (isNativePlatform()) {
    return '去背景失败：本地模型加载出错。请重试或重新安装最新版 APK。'
  }
  return '去背景失败，请稍后重试。网页端首次可能需联网加载模型。'
}

export function cutoutBusyMessage(): string {
  if (isNativePlatform()) {
    return '正在去背景（使用包内模型）…'
  }
  return '正在去背景（加载本地模型）…'
}
