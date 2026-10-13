/**
 * In-browser background removal via @imgly/background-removal.
 * Loaded from jsDelivr ESM so ONNX/WASM never enter our Pages deploy.
 * First tap needs network; inference stays on-device.
 */

type RemoveFn = (
  image: Blob,
  config?: Record<string, unknown>,
) => Promise<Blob>

let cached: RemoveFn | null = null

async function loadRemover(): Promise<RemoveFn> {
  if (cached) return cached
  const url = 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm'
  // Avoid TS resolving the CDN URL as a local module
  const dynamicImport = new Function('u', 'return import(u)') as (u: string) => Promise<{
    default?: RemoveFn
    removeBackground?: RemoveFn
  }>
  const mod = await dynamicImport(url)
  const fn = mod.default ?? mod.removeBackground
  if (!fn) throw new Error('cutout module missing export')
  cached = fn
  return fn
}

export async function removeImageBackground(blob: Blob): Promise<Blob> {
  const removeBackground = await loadRemover()
  return removeBackground(blob, {
    model: 'isnet_quint8',
    output: { format: 'image/png', quality: 0.9 },
  })
}
