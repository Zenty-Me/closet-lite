import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDeletedItems,
  getDeletedOutfits,
  hardDeleteItem,
  hardDeleteOutfit,
  restoreItem,
  restoreOutfit,
} from '../db'
import type { ClothingItem, Outfit } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { EmptyState } from '../components/EmptyState'
import { Toast } from '../components/Toast'

function ItemRow({
  item,
  onRestore,
  onPurge,
}: {
  item: ClothingItem
  onRestore: () => void
  onPurge: () => void
}) {
  const url = useBlobUrl(item.imageBlob)
  return (
    <div className="recycle-row">
      {url ? <img className="recycle-thumb" src={url} alt="" /> : <div className="recycle-thumb" />}
      <div className="recycle-info">
        <div className="insight-name">{item.name || item.category}</div>
        <div className="insight-meta">{item.category}</div>
      </div>
      <div className="recycle-actions">
        <button type="button" className="btn-text" onClick={onRestore}>
          恢复
        </button>
        <button type="button" className="btn-text danger-text" onClick={onPurge}>
          删除
        </button>
      </div>
    </div>
  )
}

export function RecycleBin() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setItems(await getDeletedItems())
    setOutfits(await getDeletedOutfits())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const emptyAll = async () => {
    if (items.length + outfits.length === 0) return
    if (!confirm('清空回收站？将永久删除其中的单品与搭配（含图片）。')) return
    for (const it of items) await hardDeleteItem(it.id)
    for (const o of outfits) await hardDeleteOutfit(o.id)
    await load()
    setToast('回收站已清空')
  }

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate('/me')}>
        ← 返回
      </button>
      <div className="page-head-row">
        <h1 className="page-title">回收站</h1>
        {(items.length > 0 || outfits.length > 0) && (
          <button type="button" className="btn-text danger-text" onClick={() => void emptyAll()}>
            清空
          </button>
        )}
      </div>
      <p className="page-sub">软删除的内容会出现在这里</p>

      {items.length === 0 && outfits.length === 0 ? (
        <EmptyState icon="🗑" title="回收站是空的" description="删除的单品和搭配会暂存在这里" />
      ) : (
        <>
          {items.length > 0 && (
            <section className="insight-section">
              <h3 className="insight-title">单品（{items.length}）</h3>
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onRestore={() =>
                    void restoreItem(it.id).then(load).then(() => setToast('已恢复'))
                  }
                  onPurge={() => {
                    if (!confirm('永久删除这件单品？')) return
                    void hardDeleteItem(it.id).then(load).then(() => setToast('已永久删除'))
                  }}
                />
              ))}
            </section>
          )}
          {outfits.length > 0 && (
            <section className="insight-section">
              <h3 className="insight-title">搭配（{outfits.length}）</h3>
              {outfits.map((o) => (
                <div key={o.id} className="recycle-row">
                  <div className="recycle-info" style={{ marginLeft: 0 }}>
                    <div className="insight-name">{o.name}</div>
                    <div className="insight-meta">{o.itemIds.length} 件</div>
                  </div>
                  <div className="recycle-actions">
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() =>
                        void restoreOutfit(o.id).then(load).then(() => setToast('已恢复'))
                      }
                    >
                      恢复
                    </button>
                    <button
                      type="button"
                      className="btn-text danger-text"
                      onClick={() => {
                        if (!confirm('永久删除这套搭配？')) return
                        void hardDeleteOutfit(o.id).then(load).then(() => setToast('已永久删除'))
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
