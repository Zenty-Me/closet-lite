import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  softDeleteOutfit,
  getAllItems,
  getOutfit,
  saveOutfit,
  uid,
} from '../db'
import type { ClothingItem } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { Toast } from '../components/Toast'
import { EmptyState } from '../components/EmptyState'
import { buildCollage } from '../utils/image'

function PickCell({
  item,
  selected,
  onToggle,
}: {
  item: ClothingItem
  selected: boolean
  onToggle: () => void
}) {
  const url = useBlobUrl(item.imageBlob)
  return (
    <button
      type="button"
      className={`picker-item${selected ? ' selected' : ''}`}
      onClick={onToggle}
    >
      {url && <img src={url} alt={item.name || item.category} />}
      {selected && <span className="picker-check">✓</span>}
    </button>
  )
}

export function OutfitForm() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [occasion, setOccasion] = useState('')
  const [itemIds, setItemIds] = useState<string[]>([])
  const [allItems, setAllItems] = useState<ClothingItem[]>([])
  const [coverBlob, setCoverBlob] = useState<Blob | undefined>()
  const [saving, setSaving] = useState(false)
  const [collaging, setCollaging] = useState(false)
  const [toast, setToast] = useState('')
  const [ready, setReady] = useState(false)
  const coverUrl = useBlobUrl(coverBlob ?? null)

  useEffect(() => {
    void (async () => {
      const items = await getAllItems()
      setAllItems(items)
      if (!isNew && id) {
        const outfit = await getOutfit(id)
        if (!outfit) {
          navigate('/outfits')
          return
        }
        setName(outfit.name)
        setOccasion(outfit.occasion)
        setItemIds(outfit.itemIds)
        setCoverBlob(outfit.coverBlob)
      }
      setReady(true)
    })()
  }, [id, isNew, navigate])

  const selectedItems = useMemo(
    () => itemIds.map((iid) => allItems.find((i) => i.id === iid)).filter(Boolean) as ClothingItem[],
    [itemIds, allItems],
  )

  const toggle = (itemId: string) => {
    setItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId],
    )
  }

  const makeCollage = async () => {
    if (selectedItems.length === 0) {
      setToast('请先选择单品')
      return
    }
    setCollaging(true)
    try {
      const blob = await buildCollage(selectedItems.map((i) => i.imageBlob))
      setCoverBlob(blob)
      setToast('拼图已生成')
    } catch {
      setToast('拼图失败')
    }
    setCollaging(false)
  }

  const onSave = async () => {
    if (itemIds.length === 0) {
      setToast('请至少选择一件单品')
      return
    }
    setSaving(true)
    const now = Date.now()
    const existing = !isNew && id ? await getOutfit(id) : undefined
    const outfitId = existing?.id ?? uid()
    await saveOutfit({
      id: outfitId,
      name: name.trim() || '未命名搭配',
      occasion: occasion.trim(),
      itemIds,
      coverBlob,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
    })
    setSaving(false)
    navigate(`/outfits/${outfitId}`, { replace: true })
  }

  const onDelete = async () => {
    if (!id || isNew) return
    if (!confirm('移入回收站？可在「我的 → 回收站」恢复。')) return
    await softDeleteOutfit(id)
    navigate('/outfits', { replace: true })
  }

  if (!ready) return null

  if (allItems.length === 0) {
    return (
      <div>
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <EmptyState
          icon="👗"
          title="先添加单品"
          description="搭配需要从衣橱里挑选单品，先去拍几件吧"
          actionLabel="去衣橱"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="page-title">{isNew ? '创建搭配' : '编辑搭配'}</h1>

      <div className="form-group">
        <label className="form-label" htmlFor="oname">
          名称
        </label>
        <input
          id="oname"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：周末休闲"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="occ">
          场合（可选）
        </label>
        <input
          id="occ"
          className="form-input"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="通勤 / 约会 / 运动…"
        />
      </div>

      <div className="form-group">
        <div className="form-label">选择单品（已选 {itemIds.length}）</div>
        <div className="picker-grid">
          {allItems.map((it) => (
            <PickCell
              key={it.id}
              item={it}
              selected={itemIds.includes(it.id)}
              onToggle={() => toggle(it.id)}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">拼图封面（可选）</div>
        <p className="insight-hint">按已选单品顺序竖向拼成一张 lookboard</p>
        {coverUrl && <img className="collage-preview" src={coverUrl} alt="拼图预览" />}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            disabled={collaging || itemIds.length === 0}
            onClick={() => void makeCollage()}
          >
            {collaging ? '生成中…' : '生成拼图'}
          </button>
          {coverBlob && (
            <button type="button" className="btn btn-ghost" onClick={() => setCoverBlob(undefined)}>
              清除
            </button>
          )}
        </div>
      </div>

      <div className="form-actions">
        {!isNew && (
          <button type="button" className="btn btn-danger" onClick={() => void onDelete()}>
            删除
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
