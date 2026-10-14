import { useEffect, useState } from 'react'
import {
  fetchRemoteVersion,
  isNativePlatform,
  isNewerVersion,
  markAutoChecked,
  openUpdateAction,
  shouldAutoCheck,
  type RemoteAppVersion,
} from '../utils/appUpdate'

/** Quiet daily update check; sheet only when a newer version exists. */
export function UpdatePrompt() {
  const [remote, setRemote] = useState<RemoteAppVersion | null>(null)

  useEffect(() => {
    if (!shouldAutoCheck()) return
    let cancelled = false
    void (async () => {
      const r = await fetchRemoteVersion()
      markAutoChecked()
      if (!cancelled && r && isNewerVersion(r)) setRemote(r)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!remote) return null

  return (
    <div className="overlay" onClick={() => setRemote(null)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">发现新版本 {remote.version}</div>
        {remote.notes ? <p className="insight-hint">{remote.notes}</p> : null}
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          onClick={() => {
            openUpdateAction(remote)
            setRemote(null)
          }}
        >
          {isNativePlatform() ? '下载 APK 更新' : '刷新网页'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          style={{ marginTop: 8 }}
          onClick={() => setRemote(null)}
        >
          稍后
        </button>
      </div>
    </div>
  )
}
