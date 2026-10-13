import { useRef } from 'react'

interface Props {
  onPick: (file: File) => void
}

export function ImagePicker({ onPick }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const albumRef = useRef<HTMLInputElement>(null)

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onPick(file)
    e.target.value = ''
  }

  return (
    <div className="image-picker">
      <button type="button" className="image-picker-btn" onClick={() => cameraRef.current?.click()}>
        📷 拍照
      </button>
      <button type="button" className="image-picker-btn" onClick={() => albumRef.current?.click()}>
        🖼 相册
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handle}
      />
      <input
        ref={albumRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handle}
      />
    </div>
  )
}
