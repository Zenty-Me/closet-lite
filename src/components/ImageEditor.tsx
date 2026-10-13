import { useEffect, useRef, useState } from 'react'
import { cropImage, rotateImage } from '../utils/image'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { removeImageBackground } from '../utils/cutout'

interface Props {
  blob: Blob
  onChange: (next: Blob) => void
  /** Snapshot taken before edits so 「恢复原图」 works */
  originalBlob?: Blob | null
  onOriginalChange?: (blob: Blob) => void
  enableCutout?: boolean
}

export function ImageEditor({
  blob,
  onChange,
  originalBlob,
  onOriginalChange,
  enableCutout = true,
}: Props) {
  const url = useBlobUrl(blob)
  const imgRef = useRef<HTMLImageElement>(null)
  const [cropping, setCropping] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [drag, setDrag] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    setError('')
  }, [blob])

  const rotate = async () => {
    setBusy('旋转中…')
    try {
      const next = await rotateImage(blob, 1)
      onChange(next)
    } catch {
      setError('旋转失败')
    }
    setBusy('')
  }

  const pointInImage = (clientX: number, clientY: number) => {
    const img = imgRef.current
    if (!img) return null
    const r = img.getBoundingClientRect()
    const x = (clientX - r.left) / r.width
    const y = (clientY - r.top) / r.height
    if (x < 0 || y < 0 || x > 1 || y > 1) return null
    return { x, y }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!cropping) return
    const p = pointInImage(e.clientX, e.clientY)
    if (!p) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    start.current = p
    setDrag({ x: p.x, y: p.y, w: 0, h: 0 })
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!cropping || !start.current) return
    const p = pointInImage(e.clientX, e.clientY)
    if (!p) return
    const x = Math.min(start.current.x, p.x)
    const y = Math.min(start.current.y, p.y)
    setDrag({
      x,
      y,
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    })
  }

  const onPointerUp = () => {
    start.current = null
  }

  const applyCrop = async () => {
    if (!drag || drag.w < 0.05 || drag.h < 0.05) {
      setError('请拖选一块区域')
      return
    }
    setBusy('裁剪中…')
    try {
      const next = await cropImage(blob, drag)
      onChange(next)
      setCropping(false)
      setDrag(null)
    } catch {
      setError('裁剪失败')
    }
    setBusy('')
  }

  const cutout = async () => {
    setBusy('正在去背景（首次需下载模型，请稍候）…')
    setError('')
    try {
      if (onOriginalChange && !originalBlob) onOriginalChange(blob)
      const raw = await removeImageBackground(blob)
      onChange(raw)
    } catch (err) {
      console.error(err)
      setError('去背景失败，可稍后重试。需联网下载本地模型。')
    }
    setBusy('')
  }

  const restore = () => {
    if (!originalBlob) return
    onChange(originalBlob)
  }

  return (
    <div className="image-editor">
      <div
        className={`image-editor-stage${cropping ? ' cropping' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {url && <img ref={imgRef} className="image-preview" src={url} alt="预览" draggable={false} />}
        {cropping && drag && drag.w > 0 && (
          <div
            className="crop-box"
            style={{
              left: `${drag.x * 100}%`,
              top: `${drag.y * 100}%`,
              width: `${drag.w * 100}%`,
              height: `${drag.h * 100}%`,
            }}
          />
        )}
      </div>

      <div className="image-editor-tools">
        <button type="button" className="chip" disabled={!!busy} onClick={() => void rotate()}>
          旋转 90°
        </button>
        {!cropping ? (
          <button type="button" className="chip" disabled={!!busy} onClick={() => setCropping(true)}>
            裁剪
          </button>
        ) : (
          <>
            <button type="button" className="chip active" disabled={!!busy} onClick={() => void applyCrop()}>
              确认裁剪
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => {
                setCropping(false)
                setDrag(null)
              }}
            >
              取消
            </button>
          </>
        )}
        {enableCutout && (
          <button type="button" className="chip" disabled={!!busy} onClick={() => void cutout()}>
            去背景
          </button>
        )}
        {originalBlob && (
          <button type="button" className="chip" disabled={!!busy} onClick={restore}>
            恢复原图
          </button>
        )}
      </div>
      {busy && <p className="editor-status">{busy}</p>}
      {error && <p className="editor-status error">{error}</p>}
    </div>
  )
}
