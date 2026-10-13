import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { softDeleteOutfit, getItemsByIds, getOutfit } from '../db'
import type { ClothingItem, Outfit } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'

function LargeThumb({ item, onClick }: { item: ClothingItem; onClick: () => void }) {
  const url = useBlobUrl(item.imageBlob)
  return (
    <button type="button" className="detail-thumb-card" onClick={onClick}>
      {url ? (
        <img src={url} alt={item.name || item.category} />
      ) : (
        <div className="detail-thumb-placeholder" />
      )}
      <span className="detail-thumb-label">{item.name || item.category}</span>
      <span className="detail-thumb-meta">
        {item.category}  {item.color}
      </span>
    </button>
  )
}

export function OutfitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [outfit, setOutfit] = useState<Outfit | null>(null)
  const [items, setItems] = useState<ClothingItem[]>([])
  const [ready, setReady] = useState(false)
  const coverUrl = useBlobUrl(outfit?.coverBlob ?? null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      const o = await getOutfit(id)
      if (!o) {
        navigate('/outfits', { replace: true })
        return
      }
      setOutfit(o)
      setItems(await getItemsByIds(o.itemIds))
      setReady(true)
    })()
  }, [id, navigate])

  const onDelete = async () => {
    if (!outfit) return
    if (!confirm('移入回收站？可在「我的 → 回收站」恢复。')) return
    await softDeleteOutfit(outfit.id)
    navigate('/outfits', { replace: true })
  }

  if (!ready || !outfit) return null

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate('/outfits')}>
        ← 返回
      </button>
      <h1 className="page-title">{outfit.name || '未命名搭配'}</h1>
      {outfit.occasion ? (
        <p className="page-sub">场合：{outfit.occasion}</p>
      ) : (
        <p className="page-sub">共 {items.length} 件单品</p>
      )}

      {coverUrl && (
        <img className="collage-preview" src={coverUrl} alt="搭配拼图" />
      )}

      {items.length === 0 ? (
        <p className="notes">这套搭配里的单品已被删除，建议编辑或删除。</p>
      ) : (
        <div className="detail-thumb-grid">
          {items.map((it) => (
            <LargeThumb
              key={it.id}
              item={it}
              onClick={() => navigate(`/items/${it.id}`)}
            />
          ))}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-danger" onClick={() => void onDelete()}>
          删除
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/outfits/${outfit.id}/edit`)}
        >
          编辑
        </button>
      </div>
    </div>
  )
}
