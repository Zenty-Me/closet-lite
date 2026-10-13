import { useEffect, useRef, useState } from 'react'
import { COLOR_PRESETS, normalizeColorHex } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'

interface Props {
  value: string
  onChange: (hex: string) => void
  /** Optional photo for eyedropper sampling */
  sampleBlob?: Blob | null
}

export function ColorPicker({ value, onChange, sampleBlob }: Props) {
  const hex = normalizeColorHex(value)
  const [eyedrop, setEyedrop] = useState(false)
  const imgUrl = useBlobUrl(sampleBlob ?? null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!imgUrl || !eyedrop) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const c = canvasRef.current
      if (!c) return
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')
      ctx?.drawImage(img, 0, 0)
    }
    img.src = imgUrl
  }, [imgUrl, eyedrop])

  const sampleAt = (clientX: number, clientY: number, el: HTMLElement) => {
    const img = imgRef.current
    const c = canvasRef.current
    if (!img || !c) return
    const rect = el.getBoundingClientRect()
    const x = Math.floor(((clientX - rect.left) / rect.width) * img.naturalWidth)
    const y = Math.floor(((clientY - rect.top) / rect.height) * img.naturalHeight)
    const ctx = c.getContext('2d')
    if (!ctx) return
    const d = ctx.getImageData(Math.max(0, x), Math.max(0, y), 1, 1).data
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    onChange(`#${toHex(d[0])}${toHex(d[1])}${toHex(d[2])}`)
    setEyedrop(false)
  }

  return (
    <div className="color-picker">
      <div className="swatch-grid">
        {COLOR_PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            className={`swatch-btn${hex === p.hex ? ' active' : ''}`}
            style={{ background: p.hex }}
            title={p.label}
            aria-label={p.label}
            onClick={() => onChange(p.hex)}
          />
        ))}
      </div>

      <div className="color-custom-row">
        <label className="color-native-wrap" title="自定义取色">
          <span className="swatch-btn custom" style={{ background: hex }} />
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(normalizeColorHex(e.target.value))}
            aria-label="自定义颜色"
          />
        </label>
        <span className="color-hex-label">{hex.toUpperCase()}</span>
        {sampleBlob && (
          <button
            type="button"
            className={`btn btn-ghost${eyedrop ? ' active-ghost' : ''}`}
            onClick={() => setEyedrop((v) => !v)}
          >
            {eyedrop ? '点图片取色…' : '从照片取色'}
          </button>
        )}
      </div>

      {eyedrop && imgUrl && (
        <div className="eyedrop-stage">
          <p className="insight-hint">点击照片上的位置吸取颜色</p>
          <button
            type="button"
            className="eyedrop-img-btn"
            onClick={(e) => sampleAt(e.clientX, e.clientY, e.currentTarget)}
          >
            <img src={imgUrl} alt="取色" draggable={false} />
          </button>
          <canvas ref={canvasRef} className="sr-only" />
        </div>
      )}
    </div>
  )
}
