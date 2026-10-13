import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  deleteOutfit,
  getAllItems,
  getOutfit,
  saveOutfit,
  uid,
} from '../db'
import type { ClothingItem } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { Toast } from '../components/Toast'
import { EmptyState } from '../components/EmptyState'

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
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      const items = await getAllItems()
      setAllItems(items)
      if (!isNew) {
        const outfit = await getOutfit(id!)
        if (!outfit) {
          navigate('/outfits')
          return
        }
        setName(outfit.name)
        setOccasion(outfit.occasion)
        setItemIds(outfit.itemIds)
      }
      setReady(true)
    })()
  }, [id, isNew, navigate])

  const toggle = (itemId: string) => {
    setItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId],
    )
  }

  const onSave = async () => {
    if (itemIds.length === 0) {
      setToast('请至少选择一件单品')
      return
    }
    setSaving(true)
    const now = Date.now()
    const existing = !isNew ? await getOutfit(id!) : undefined
    await saveOutfit({
      id: existing?.id ?? uid(),
      name: name.trim() || '未命名搭配',
      occasion: occasion.trim(),
      itemIds,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    setSaving(false)
    navigate('/outfits')
  }

  const onDelete = async () => {
    if (!id || isNew) return
    if (!confirm('确定删除这套搭配？')) return
    await deleteOutfit(id)
    navigate('/outfits')
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

      <div className="form-actions">
        {!isNew && (
          <button type="button" className="btn btn-danger" onClick={onDelete}>
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
