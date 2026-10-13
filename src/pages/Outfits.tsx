import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllOutfits, getItemsByIds } from '../db'
import type { ClothingItem, Outfit } from '../types'
import { EmptyState } from '../components/EmptyState'
import { useBlobUrl } from '../hooks/useBlobUrl'

function OutfitThumb({ item }: { item: ClothingItem }) {
  const url = useBlobUrl(item.imageBlob)
  return url ? (
    <img className="outfit-thumb" src={url} alt={item.name || item.category} />
  ) : (
    <div className="outfit-thumb" />
  )
}

function OutfitCard({
  outfit,
  onClick,
}: {
  outfit: Outfit
  onClick: () => void
}) {
  const [items, setItems] = useState<ClothingItem[]>([])

  useEffect(() => {
    void getItemsByIds(outfit.itemIds).then(setItems)
  }, [outfit.itemIds])

  return (
    <button type="button" className="outfit-card" onClick={onClick}>
      <div className="outfit-card-title">{outfit.name || '未命名搭配'}</div>
      {outfit.occasion && (
        <div className="outfit-card-occ">{outfit.occasion}</div>
      )}
      <div className="outfit-thumbs">
        {items.slice(0, 6).map((it) => (
          <OutfitThumb key={it.id} item={it} />
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            暂无单品
          </span>
        )}
      </div>
    </button>
  )
}

export function Outfits() {
  const navigate = useNavigate()
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setOutfits(await getAllOutfits())
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="page-with-fab">
      <h1 className="page-title">搭配</h1>
      <p className="page-sub">
        {outfits.length > 0 ? `共 ${outfits.length} 套搭配` : '组合单品，保存穿搭灵感'}
      </p>

      {loading ? null : outfits.length === 0 ? (
        <EmptyState
          icon="✨"
          title="还没有搭配"
          description="从衣橱里挑选几件单品，保存一套完整穿搭"
          actionLabel="创建搭配"
          onAction={() => navigate('/outfits/new')}
        />
      ) : (
        <div className="outfit-list">
          {outfits.map((o) => (
            <OutfitCard
              key={o.id}
              outfit={o}
              onClick={() => navigate(`/outfits/${o.id}`)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="fab"
        aria-label="创建搭配"
        onClick={() => navigate('/outfits/new')}
      >
        +
      </button>
    </div>
  )
}
