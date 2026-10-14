/**
 * Runs @imgly/background-removal off the UI thread.
 * Android Capacitor WebView freezes when ONNX/WASM runs on the main thread.
 */
import { preload, removeBackground } from '@imgly/background-removal'

export type CutoutWorkerIn =
  | { id: number; type: 'preload'; publicPath: string; device: 'cpu' | 'gpu' }
  | {
      id: number
      type: 'remove'
      publicPath: string
      device: 'cpu' | 'gpu'
      buffer: ArrayBuffer
      mime: string
    }

export type CutoutWorkerOut =
  | { id: number; type: 'progress'; key: string; current: number; total: number }
  | { id: number; type: 'done'; buffer?: ArrayBuffer; mime?: string }
  | { id: number; type: 'error'; message: string }

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = async (ev: MessageEvent<CutoutWorkerIn>) => {
  const msg = ev.data
  const progress = (key: string, current: number, total: number) => {
    const out: CutoutWorkerOut = { id: msg.id, type: 'progress', key, current, total }
    ctx.postMessage(out)
  }

  try {
    const base = {
      publicPath: msg.publicPath,
      model: 'isnet_quint8' as const,
      device: msg.device,
      // Already inside a worker; nested ORT proxy worker is unnecessary.
      proxyToWorker: false,
      progress,
      output: { format: 'image/png' as const, quality: 0.85 },
    }

    if (msg.type === 'preload') {
      await preload(base)
      const out: CutoutWorkerOut = { id: msg.id, type: 'done' }
      ctx.postMessage(out)
      return
    }

    const blob = new Blob([msg.buffer], { type: msg.mime || 'image/png' })
    const result = await removeBackground(blob, base)
    const ab = await result.arrayBuffer()
    const out: CutoutWorkerOut = {
      id: msg.id,
      type: 'done',
      buffer: ab,
      mime: result.type || 'image/png',
    }
    ctx.postMessage(out, [ab])
  } catch (err) {
    const out: CutoutWorkerOut = {
      id: msg.id,
      type: 'error',
      message: err instanceof Error ? err.message : String(err ?? 'cutout worker failed'),
    }
    ctx.postMessage(out)
  }
}
