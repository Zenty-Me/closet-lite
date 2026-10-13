import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClothingItem } from '../types'
import { currentSeason, suggestTodayOutfit } from '../utils/suggest'
import { saveOutfit, uid } from '../db'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { Toast } from './Toast'

function MiniThumb({ item }: { item: ClothingItem }) {
  const url = useBlobUrl(item.imageBlob)
  return url ? (
    <img className="suggest-thumb" src={url} alt={item.name || item.category} />
  ) : (
    <div className="suggest-thumb" />
  )
}

interface Props {
  items: ClothingItem[]
}

export function TodaySuggest({ items }: Props) {
  const navigate = useNavigate()
  const season = currentSeason()
  const [picks, setPicks] = useState<ClothingItem[]>([])
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(() => {
    setPicks(suggestTodayOutfit(items, season))
  }, [items, season])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveAsOutfit = async () => {
    if (picks.length === 0) return
    setSaving(true)
    const now = Date.now()
    const id = uid()
    await saveOutfit({
      id,
      name: `今日可穿（${season}）`,
      occasion: '日常',
      itemIds: picks.map((p) => p.id),
      createdAt: now,
      updatedAt: now,
    })
    setSaving(false)
    setToast('已保存为搭配')
    setTimeout(() => navigate(`/outfits/${id}`), 600)
  }

  if (items.length < 2) return null

  const seasonalCount = items.filter(
    (i) => i.season === '四季' || i.season === season,
  ).length

  if (seasonalCount === 0) {
    return (
      <section className="suggest-card">
        <div className="suggest-head">
          <h3>今日可穿（{season}）</h3>
        </div>
        <p className="suggest-empty">
          当前季节还没有合适的单品。添加标注为「{season}」或「四季」的衣服试试。
        </p>
      </section>
    )
  }

  return (
    <section className="suggest-card">
      <div className="suggest-head">
        <h3>今日可穿（{season}）</h3>
        <button type="button" className="btn-text" onClick={refresh}>
          换一套
        </button>
      </div>
      {picks.length === 0 ? (
        <p className="suggest-empty">暂时凑不出搭配，再多加几件当季单品吧。</p>
      ) : (
        <>
          <div className="suggest-thumbs">
            {picks.map((it) => (
              <button
                key={it.id}
                type="button"
                className="suggest-thumb-wrap"
                onClick={() => navigate(`/items/${it.id}`)}
              >
                <MiniThumb item={it} />
                <span>{it.category}</span>
              </button>
            ))}
          </div>
          <div className="suggest-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={saving}
              onClick={() => void saveAsOutfit()}
            >
              {saving ? '保存中…' : '保存为搭配'}
            </button>
          </div>
        </>
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </section>
  )
}
