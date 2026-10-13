import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearAllData,
  countOutfits,
  countWearLogs,
  getAllItems,
  getAllOutfits,
  getAllWearLogs,
  importAllData,
} from '../db'
import type { BackupData, ClothingItem } from '../types'
import { base64ToBlob, blobToBase64 } from '../utils/image'
import { rankItemsByWear, type ItemWearStat } from '../utils/wearStats'
import { WearInsight } from '../components/WearInsight'
import { Toast } from '../components/Toast'

export function Profile() {
  const [itemCount, setItemCount] = useState(0)
  const [outfitCount, setOutfitCount] = useState(0)
  const [logCount, setLogCount] = useState(0)
  const [top, setTop] = useState<ItemWearStat[]>([])
  const [forgotten, setForgotten] = useState<ItemWearStat[]>([])
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    const [items, logs, oc, lc] = await Promise.all([
      getAllItems(),
      getAllWearLogs(),
      countOutfits(),
      countWearLogs(),
    ])
    setItemCount(items.length)
    setOutfitCount(oc)
    setLogCount(lc)
    const ranked = rankItemsByWear(items, logs)
    setTop(ranked.top)
    setForgotten(ranked.forgotten)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const exportBackup = async () => {
    setBusy(true)
    try {
      const items = await getAllItems()
      const outfits = await getAllOutfits()
      const wearLogs = await getAllWearLogs()
      const exportedItems = await Promise.all(
        items.map(async (it) => {
          const { imageBlob, ...rest } = it
          return {
            ...rest,
            imageBase64: await blobToBase64(imageBlob),
          }
        }),
      )
      const data: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items: exportedItems,
        outfits,
        wearLogs,
      }
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qing-yichu-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setToast('备份已导出')
    } catch {
      setToast('导出失败')
    }
    setBusy(false)
  }

  const importBackup = async (file: File) => {
    setBusy(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as BackupData
      if (!data || data.version !== 1 || !Array.isArray(data.items)) {
        throw new Error('invalid')
      }
      if (
        !confirm(
          `将导入 ${data.items.length} 件单品、${data.outfits?.length ?? 0} 套搭配。同 ID 会覆盖，确定继续？`,
        )
      ) {
        setBusy(false)
        return
      }
      const items: ClothingItem[] = await Promise.all(
        data.items.map(async (it) => {
          const { imageBase64, ...rest } = it
          return {
            ...rest,
            imageBlob: await base64ToBlob(imageBase64),
          }
        }),
      )
      await importAllData(items, data.outfits ?? [], data.wearLogs ?? [])
      await refresh()
      setToast('导入成功')
    } catch {
      setToast('导入失败，请检查备份文件')
    }
    setBusy(false)
  }

  const clearData = async () => {
    if (
      !confirm(
        '确定清空全部数据？单品、搭配、穿着记录都会删除，且无法恢复（请先导出备份）。',
      )
    )
      return
    if (!confirm('再次确认：真的要清空吗？')) return
    await clearAllData()
    await refresh()
    setToast('已清空全部数据')
  }

  return (
    <div>
      <h1 className="page-title">我的</h1>
      <p className="page-sub">数据只存在你的手机里</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-num">{itemCount}</div>
          <div className="stat-label">单品</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{outfitCount}</div>
          <div className="stat-label">搭配</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{logCount}</div>
          <div className="stat-label">穿着记录</div>
        </div>
      </div>

      {itemCount > 0 && <WearInsight top={top} forgotten={forgotten} />}

      <div className="menu-list">
        <button
          type="button"
          className="menu-item"
          disabled={busy}
          onClick={() => void exportBackup()}
        >
          <span>导出备份</span>
          <span>JSON</span>
        </button>
        <button
          type="button"
          className="menu-item"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <span>导入备份</span>
          <span>从文件恢复</span>
        </button>
        <button type="button" className="menu-item" onClick={() => void clearData()}>
          <span style={{ color: 'var(--danger)' }}>清空全部数据</span>
          <span />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void importBackup(f)
          e.target.value = ''
        }}
      />

      <div className="help-box">
        <h4>如何添加到主屏幕？</h4>
        <p style={{ marginBottom: 8 }}>
          把「轻衣橱」装到手机桌面，像 App 一样打开，离线也能用。
        </p>
        <ol>
          <li>
            <strong>iPhone（Safari）</strong>：点底部分享按钮 →「添加到主屏幕」
          </li>
          <li>
            <strong>Android（Chrome）</strong>：菜单 ⋮ →「添加到主屏幕」或「安装应用」
          </li>
        </ol>
        <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
          所有照片与数据保存在本机 IndexedDB，不会上传到任何服务器。换机前请先导出备份。
        </p>
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        轻衣橱 v1.1 · 本地优先 · 开源免费
      </p>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
