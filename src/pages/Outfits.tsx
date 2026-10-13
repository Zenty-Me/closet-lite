import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllItems, getAllOutfits, getItemsByIds, saveOutfit, uid } from '../db'
import type { ClothingItem, Outfit } from '../types'
import { EmptyState } from '../components/EmptyState'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { randomOutfit } from '../utils/randomOutfit'
import { loadSettings } from '../utils/settings'
import { Toast } from '../components/Toast'

function OutfitThumb({ item }: { item: ClothingItem }) {
  const url = useBlobUrl(item.imageBlob)
  return url ? (
    <img className="outfit-thumb" src={url} alt={item.name || item.category} />
  ) : (
    <div className="outfit-thumb" />
  )
}

function OutfitCard({ outfit, onClick }: { outfit: Outfit; onClick: () => void }) {
  const [items, setItems] = useState<ClothingItem[]>([])
  const coverUrl = useBlobUrl(outfit.coverBlob ?? null)
  useEffect(() => {
    void getItemsByIds(outfit.itemIds).then(setItems)
  }, [outfit.itemIds])
  return (
    <button type="button" className="outfit-card" onClick={onClick}>
      {coverUrl && <img className="outfit-cover" src={coverUrl} alt="" />}
      <div className="outfit-card-title">{outfit.name || '未命名搭配'}</div>
      {outfit.occasion && <div className="outfit-card-occ">{outfit.occasion}</div>}
      <div className="outfit-thumbs">
        {items.slice(0, 6).map((it) => (
          <OutfitThumb key={it.id} item={it} />
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>暂无单品</span>
        )}
      </div>
    </button>
  )
}

export function Outfits() {
  const navigate = useNavigate()
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [allItems, setAllItems] = useState<ClothingItem[]>([])
  const [randomPicks, setRandomPicks] = useState<ClothingItem[]>([])
  const [showRandom, setShowRandom] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [o, items] = await Promise.all([getAllOutfits(), getAllItems()])
    setOutfits(o)
    setAllItems(items)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rollRandom = () => {
    const settings = loadSettings()
    const season = settings.seasonMode ? settings.currentSeasonFilter : null
    const picks = randomOutfit(allItems, season)
    setRandomPicks(picks)
    setShowRandom(true)
    if (picks.length === 0) setToast('单品不够，先多加几件吧')
  }

  const saveRandom = async () => {
    if (randomPicks.length === 0) return
    setSaving(true)
    const now = Date.now()
    const id = uid()
    await saveOutfit({
      id,
      name: '随机搭配',
      occasion: '日常',
      itemIds: randomPicks.map((p) => p.id),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
    setSaving(false)
    setToast('已保存')
    setShowRandom(false)
    await load()
    navigate(`/outfits/${id}`)
  }

  return (
    <div className="page-with-fab">
      <h1 className="page-title">搭配</h1>
      <p className="page-sub">
        {outfits.length > 0 ? `共 ${outfits.length} 套搭配` : '组合单品，保存穿搭灵感'}
      </p>

      {allItems.length >= 2 && (
        <button type="button" className="btn btn-secondary btn-block" style={{ marginBottom: 14 }} onClick={rollRandom}>
          随机搭配
        </button>
      )}

      {showRandom && randomPicks.length > 0 && (
        <section className="suggest-card">
          <div className="suggest-head">
            <h3>随机一组</h3>
            <button type="button" className="btn-text" onClick={rollRandom}>
              换一组
            </button>
          </div>
          <div className="suggest-thumbs">
            {randomPicks.map((it) => (
              <button
                key={it.id}
                type="button"
                className="suggest-thumb-wrap"
                onClick={() => navigate(`/items/${it.id}`)}
              >
                <OutfitThumb item={it} />
                <span>{it.category}</span>
              </button>
            ))}
          </div>
          <div className="suggest-actions">
            <button
              type="button"
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => setShowRandom(false)}
            >
              关闭
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={saving}
              onClick={() => void saveRandom()}
            >
              保存为搭配
            </button>
          </div>
        </section>
      )}

      {loading ? null : outfits.length === 0 ? (
        <EmptyState
          icon="✨"
          title="还没有搭配"
          description="从衣橱里挑选几件单品，或试试随机搭配"
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
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
