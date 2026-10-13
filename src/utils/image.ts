const MAX_EDGE = 1200
const QUALITY = 0.8

export async function compressImage(
  file: File | Blob,
  mime: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap

  if (width > MAX_EDGE || height > MAX_EDGE) {
    if (width > height) {
      height = Math.round((height / width) * MAX_EDGE)
      width = MAX_EDGE
    } else {
      width = Math.round((width / height) * MAX_EDGE)
      height = MAX_EDGE
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片压缩失败'))
      },
      mime,
      QUALITY,
    )
  })
}

/** Rotate blob by 90 * turns degrees clockwise. */
export async function rotateImage(blob: Blob, turns: number): Promise<Blob> {
  const t = ((turns % 4) + 4) % 4
  if (t === 0) return blob
  const bitmap = await createImageBitmap(blob)
  const swap = t % 2 === 1
  const canvas = document.createElement('canvas')
  canvas.width = swap ? bitmap.height : bitmap.width
  canvas.height = swap ? bitmap.width : bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((t * 90 * Math.PI) / 180)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  bitmap.close()
  const outType = blob.type.includes('png') ? 'image/png' : 'image/jpeg'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('旋转失败'))),
      outType,
      QUALITY,
    )
  })
}

/** Crop using normalized rect 0–1 relative to image. */
export async function cropImage(
  blob: Blob,
  rect: { x: number; y: number; w: number; h: number },
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const sx = Math.round(rect.x * bitmap.width)
  const sy = Math.round(rect.y * bitmap.height)
  const sw = Math.max(1, Math.round(rect.w * bitmap.width))
  const sh = Math.max(1, Math.round(rect.h * bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh)
  bitmap.close()
  const outType = blob.type.includes('png') ? 'image/png' : 'image/jpeg'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('裁剪失败'))),
      outType,
      QUALITY,
    )
  })
}

/** Stack item images into a vertical lookboard collage. */
export async function buildCollage(blobs: Blob[], width = 800): Promise<Blob> {
  if (blobs.length === 0) throw new Error('无图片')
  const bitmaps = await Promise.all(blobs.map((b) => createImageBitmap(b)))
  const gap = 16
  const pad = 24
  const heights = bitmaps.map((bm) => Math.round((bm.height / bm.width) * (width - pad * 2)))
  const totalH = pad * 2 + heights.reduce((a, b) => a + b, 0) + gap * (bitmaps.length - 1)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#F5F5F5'
  ctx.fillRect(0, 0, width, totalH)
  let y = pad
  const innerW = width - pad * 2
  for (let i = 0; i < bitmaps.length; i++) {
    const bm = bitmaps[i]
    const h = heights[i]
    ctx.drawImage(bm, pad, y, innerW, h)
    y += h + gap
    bm.close()
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('拼图失败'))),
      'image/jpeg',
      QUALITY,
    )
  })
}

export function blobToObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob)
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`
}

export async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}
