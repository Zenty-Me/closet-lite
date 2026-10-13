/**
 * In-browser background removal via @imgly/background-removal (CDN ESM).
 * Model/WASM assets prefer same-origin `${BASE_URL}bg-removal/` (isnet_quint8),
 * with fallback to IMG.LY CDN if local resources.json is missing.
 * Avoids bundling ~24MB ONNX WASM into the Vite app chunk.
 */

type RemoveFn = (
  image: Blob,
  config?: Record<string, unknown>,
) => Promise<Blob>

let cached: RemoveFn | null = null
let resolvedPublicPath: string | null = null

const PKG = '1.7.0'
const CDN_DATA = `https://staticimgly.com/@imgly/background-removal-data/${PKG}/dist/`
const CDN_ESM = `https://cdn.jsdelivr.net/npm/@imgly/background-removal@${PKG}/+esm`

function localPublicPath(): string {
  const base = import.meta.env.BASE_URL || '/'
  const joined = `${base.endsWith('/') ? base : `${base}/`}bg-removal/`
  return joined
}

async function probeLocal(): Promise<string | null> {
  const path = localPublicPath()
  try {
    const res = await fetch(`${path}resources.json`, { method: 'GET', cache: 'force-cache' })
    if (!res.ok) return null
    const json = (await res.json()) as Record<string, unknown>
    if (!json['/models/isnet_quint8']) return null
    return path
  } catch {
    return null
  }
}

async function loadRemover(): Promise<RemoveFn> {
  if (cached) return cached
  const dynamicImport = new Function('u', 'return import(u)') as (u: string) => Promise<{
    default?: RemoveFn
    removeBackground?: RemoveFn
  }>
  const mod = await dynamicImport(CDN_ESM)
  const fn = mod.default ?? mod.removeBackground
  if (!fn) throw new Error('cutout module missing export')
  cached = fn
  return fn
}

async function resolvePublicPath(): Promise<string> {
  if (resolvedPublicPath) return resolvedPublicPath
  const local = await probeLocal()
  resolvedPublicPath = local ?? CDN_DATA
  return resolvedPublicPath
}

export async function removeImageBackground(blob: Blob): Promise<Blob> {
  const removeBackground = await loadRemover()
  const publicPath = await resolvePublicPath()
  return removeBackground(blob, {
    publicPath,
    model: 'isnet_quint8',
    output: { format: 'image/png', quality: 0.9 },
  })
}
