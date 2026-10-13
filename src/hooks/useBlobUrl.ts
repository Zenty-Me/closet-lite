import { useEffect, useState } from 'react'

export function useBlobUrl(blob: Blob | undefined | null): string {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!blob) {
      setUrl('')
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])

  return url
}
