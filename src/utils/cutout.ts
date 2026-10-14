/**
 * In-browser background removal via @imgly/background-removal (npm).
 * Model/WASM load from same-origin `${BASE_URL}bg-removal/` (isnet_quint8).
 * Native Capacitor: local assets only (no CDN). Web: CDN data fallback if local missing.
 *
 * Performance / Android WebView:
 * - Downscale input (max edge CUTOUT_MAX_EDGE) before inference — model is always 1024²;
 *   smaller input cuts mask rescale + PNG encode cost.
 * - Prefer a dedicated Web Worker so ONNX/WASM does not freeze the UI thread.
 * - Main-thread fallback still yields (double rAF) and reports progress.
 * - Optional idle preload warms the model after app open.
 *
 * Capacitor Android note: WebViewLocalServer html5mode returns index.html for any
 * path whose last segment has no `.`. Chunk files must use a dotted name (e.g. `.bin`).
 */

import { Capacitor } from '@capacitor/core'
import type { CutoutWorkerIn, CutoutWorkerOut } from './cutout.worker'

const PKG = '1.7.0'
const CDN_DATA = `https://staticimgly.com/@imgly/background-removal-data/${PKG}/dist/`

/** Max edge for cutout input. Wardrobe already compresses to ~1200; 768 is enough quality. */
export const CUTOUT_MAX_EDGE = 768

let resolvedPublicPath: string | null = null
let worker: Worker | null = null
let workerFailed = false
let nextWorkerId = 1
let warmupStarted = false

export type CutoutProgress = {
  key: string
  current: number
  total: number
  /** Rough 0–100 for UI */
  percent: number
}

export type CutoutOptions = {
  onProgress?: (p: CutoutProgress) => void
  /** Force main-thread path (tests / debugging) */
  forceMainThread?: boolean
}

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

function progressPercent(key: string, current: number, total: number): number {
  if (key.startsWith('fetch:')) {
    if (total <= 0) return 5
    return Math.min(55, Math.round((current / total) * 55))
  }
  if (key.startsWith('compute:')) {
    if (total <= 0) return 60
    return Math.min(99, 55 + Math.round((current / total) * 44))
  }
  if (total > 0) return Math.min(99, Math.round((current / total) * 100))
  return 0
}

/** Let the loading overlay paint before heavy work (main-thread path). */
export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

async function downscaleForCutout(blob: Blob, maxEdge: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  try {
    let { width, height } = bitmap
    if (width <= maxEdge && height <= maxEdge) {
      // Re-encode only if we need a PNG for alpha-friendly pipeline; keep as-is when small.
      return blob
    }
    if (width > height) {
      height = Math.round((height / width) * maxEdge)
      width = maxEdge
    } else {
      width = Math.round((width / height) * maxEdge)
      height = maxEdge
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob
    ctx.drawImage(bitmap, 0, 0, width, height)
    const out = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    })
    return out ?? blob
  } finally {
    bitmap.close()
  }
}

async function detectDevice(): Promise<'cpu' | 'gpu'> {
  try {
    const nav = navigator as Navigator & {
      gpu?: { requestAdapter: () => Promise<unknown> }
    }
    if (!nav.gpu) return 'cpu'
    const adapter = await nav.gpu.requestAdapter()
    return adapter ? 'gpu' : 'cpu'
  } catch {
    return 'cpu'
  }
}

function getWorker(): Worker | null {
  if (workerFailed) return null
  if (worker) return worker
  try {
    worker = new Worker(new URL('./cutout.worker.ts', import.meta.url), {
      type: 'module',
      name: 'qing-yichu-cutout',
    })
    worker.onerror = () => {
      workerFailed = true
      try {
        worker?.terminate()
      } catch {
        /* ignore */
      }
      worker = null
    }
    return worker
  } catch {
    workerFailed = true
    return null
  }
}

function workerCall(
  w: Worker,
  payload: CutoutWorkerIn,
  onProgress?: (p: CutoutProgress) => void,
): Promise<Blob | void> {
  return new Promise((resolve, reject) => {
    const onMessage = (ev: MessageEvent<CutoutWorkerOut>) => {
      const data = ev.data
      if (!data || data.id !== payload.id) return
      if (data.type === 'progress') {
        onProgress?.({
          key: data.key,
          current: data.current,
          total: data.total,
          percent: progressPercent(data.key, data.current, data.total),
        })
        return
      }
      w.removeEventListener('message', onMessage)
      if (data.type === 'error') {
        reject(new Error(data.message))
        return
      }
      if (data.buffer) {
        resolve(new Blob([data.buffer], { type: data.mime || 'image/png' }))
      } else {
        resolve()
      }
    }
    w.addEventListener('message', onMessage)
    if (payload.type === 'remove') {
      w.postMessage(payload, [payload.buffer])
    } else {
      w.postMessage(payload)
    }
  })
}

async function removeOnMainThread(
  blob: Blob,
  publicPath: string,
  device: 'cpu' | 'gpu',
  onProgress?: (p: CutoutProgress) => void,
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal')
  await yieldToUi()
  return removeBackground(blob, {
    publicPath,
    model: 'isnet_quint8',
    device,
    // ORT proxy worker only activates with WebGPU in imgly 1.7; still request it.
    proxyToWorker: device === 'gpu',
    progress: (key, current, total) => {
      onProgress?.({
        key,
        current,
        total,
        percent: progressPercent(key, current, total),
      })
    },
    output: { format: 'image/png', quality: 0.85 },
  })
}

export async function removeImageBackground(
  blob: Blob,
  options: CutoutOptions = {},
): Promise<Blob> {
  const publicPath = await resolvePublicPath()
  const device = await detectDevice()
  const input = await downscaleForCutout(blob, CUTOUT_MAX_EDGE)
  const onProgress = options.onProgress

  if (!options.forceMainThread) {
    const w = getWorker()
    if (w) {
      try {
        const ab = await input.arrayBuffer()
        const out = await workerCall(
          w,
          {
            id: nextWorkerId++,
            type: 'remove',
            publicPath,
            device,
            buffer: ab,
            mime: input.type || 'image/jpeg',
          },
          onProgress,
        )
        if (out instanceof Blob) return out
      } catch (err) {
        console.warn('[cutout] worker failed, falling back to main thread', err)
        workerFailed = true
        try {
          worker?.terminate()
        } catch {
          /* ignore */
        }
        worker = null
      }
    }
  }

  return removeOnMainThread(input, publicPath, device, onProgress)
}

/**
 * Warm the ONNX session after the UI is idle so the first tap is faster.
 * Safe to call multiple times; only the first attempt runs.
 */
export function scheduleCutoutWarmup(): void {
  if (warmupStarted) return
  warmupStarted = true
  const run = () => {
    void warmupCutoutModel().catch((err) => {
      console.warn('[cutout] warmup skipped', err)
    })
  }
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }
  ).requestIdleCallback
  if (typeof ric === 'function') {
    ric(run, { timeout: 5000 })
  } else {
    window.setTimeout(run, 2500)
  }
}

export async function warmupCutoutModel(): Promise<void> {
  const publicPath = await resolvePublicPath()
  const device = await detectDevice()
  const w = getWorker()
  if (w) {
    await workerCall(w, { id: nextWorkerId++, type: 'preload', publicPath, device })
    return
  }
  const { preload } = await import('@imgly/background-removal')
  await preload({
    publicPath,
    model: 'isnet_quint8',
    device,
    proxyToWorker: device === 'gpu',
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

export function cutoutBusyMessage(percent?: number): string {
  const base = isNativePlatform()
    ? '正在去背景（使用包内模型）'
    : '正在去背景（加载本地模型）'
  if (typeof percent === 'number' && percent > 0) {
    return `${base} ${Math.min(99, Math.round(percent))}%…`
  }
  return `${base}…`
}
