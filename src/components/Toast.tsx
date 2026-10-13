import { useEffect } from 'react'

interface Props {
  message: string
  onClose: () => void
}

export function Toast({ message, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 2200)
    return () => clearTimeout(t)
  }, [message, onClose])

  return <div className="toast">{message}</div>
}
