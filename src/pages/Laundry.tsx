import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLaundryItems, saveItem } from '../db'
import type { ClothingItem } from '../types'
import { CATEGORY_LABEL } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { EmptyState } from '../components/EmptyState'
import { Toast } from '../components/Toast'

function Row({
  item,
  onClean,
  onOpen,
}: {
  item: ClothingItem
  onClean: () => void
  onOpen: () => void
}) {
  const url = useBlobUrl(item.imageBlob)
  return (
    <div className="laundry-row">
      <button type="button" className="laundry-row-main" onClick={onOpen}>
        {url ? <img src={url} alt="" /> : <div className="laundry-ph" />}
        <div>
          <div className="laundry-name">{item.name || CATEGORY_LABEL[item.category]}</div>
          <div className="laundry-meta">
            {CATEGORY_LABEL[item.category]}
            {item.subcategory ? ` · ${item.subcategory}` : ''}
          </div>
        </div>
      </button>
      <button type="button" className="btn btn-secondary" onClick={onClean}>
        已洗
      </button>
    </div>
  )
}

export function Laundry() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setItems(await getLaundryItems())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const markClean = async (item: ClothingItem) => {
    await saveItem({ ...item, needsWash: false, updatedAt: Date.now() })
    setToast('已标为洗净')
    await load()
  }

  const markAllClean = async () => {
    if (!items.length) return
    if (!confirm(`将 ${items.length} 件全部标为已洗？`)) return
    const now = Date.now()
    for (const it of items) {
      await saveItem({ ...it, needsWash: false, updatedAt: now })
    }
    setToast('已全部洗净')
    await load()
  }

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="page-title">待洗</h1>
      <p className="page-sub">
        {items.length > 0 ? `${items.length} 件待洗` : '衣橱里没有待洗单品'}
      </p>

      {items.length > 0 && (
        <button type="button" className="btn btn-secondary btn-block" style={{ marginBottom: 14 }} onClick={() => void markAllClean()}>
          全部标为已洗
        </button>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="🧺"
          title="洗衣篮是空的"
          description="在单品详情里点「放入待洗」，或从衣橱筛选待洗"
          actionLabel="去衣橱"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="laundry-list">
          {items.map((it) => (
            <Row
              key={it.id}
              item={it}
              onClean={() => void markClean(it)}
              onOpen={() => navigate(`/items/${it.id}`)}
            />
          ))}
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
