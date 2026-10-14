import { useEffect, useState } from 'react'

/** Create object URL for a Blob. Pass `rev` (e.g. updatedAt) so URL refreshes when content changes. */
export function useBlobUrl(blob: Blob | undefined | null, rev?: string | number): string {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!blob) {
      setUrl('')
      return
    }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob, rev])

  return url
}
