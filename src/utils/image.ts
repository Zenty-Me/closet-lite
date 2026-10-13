const MAX_EDGE = 1200
const QUALITY = 0.8

export async function compressImage(file: File | Blob): Promise<Blob> {
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
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('图片压缩失败'))
      },
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
