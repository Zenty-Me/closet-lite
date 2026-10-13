import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CATEGORIES,
  COLORS,
  SEASONS,
  type Category,
  type ColorName,
  type Season,
} from '../types'
import { getAllWearLogs, getItem, saveItem, softDeleteItem, uid } from '../db'
import { buildWearCounts } from '../utils/wearStats'
import { compressImage } from '../utils/image'
import { ImagePicker } from '../components/ImagePicker'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { Toast } from '../components/Toast'

export function ItemForm() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('上衣')
  const [color, setColor] = useState<ColorName>('黑')
  const [season, setSeason] = useState<Season>('四季')
  const [notes, setNotes] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('')
  const [location, setLocation] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [ready, setReady] = useState(isNew)
  const [wearCount, setWearCount] = useState(0)

  const preview = useBlobUrl(imageBlob)

  useEffect(() => {
    if (isNew) return
    void (async () => {
      const item = await getItem(id!)
      if (!item || item.deletedAt) {
        navigate('/')
        return
      }
      setName(item.name)
      setCategory(item.category)
      setColor(item.color)
      setSeason(item.season)
      setNotes(item.notes)
      setBrand(item.brand)
      setPrice(item.price != null ? String(item.price) : '')
      setSize(item.size)
      setLocation(item.location)
      setTagsText(item.tags.join(' '))
      setPurchaseDate(item.purchaseDate)
      setImageBlob(item.imageBlob)
      const logs = await getAllWearLogs()
      setWearCount(buildWearCounts(logs).get(item.id)?.count ?? 0)
      setReady(true)
    })()
  }, [id, isNew, navigate])

  const onPick = async (file: File) => {
    try {
      setImageBlob(await compressImage(file))
    } catch {
      setToast('图片处理失败，请重试')
    }
  }

  const parseTags = (text: string) =>
    text
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)

  const onSave = async () => {
    if (!imageBlob) {
      setToast('请先添加一张照片')
      return
    }
    setSaving(true)
    const now = Date.now()
    const existing = !isNew ? await getItem(id!) : undefined
    const priceNum = price.trim() === '' ? null : Number(price)
    await saveItem({
      id: existing?.id ?? uid(),
      name: name.trim(),
      category,
      color,
      season,
      notes: notes.trim(),
      brand: brand.trim(),
      price: priceNum != null && !Number.isNaN(priceNum) ? priceNum : null,
      size: size.trim(),
      location: location.trim(),
      tags: parseTags(tagsText),
      purchaseDate: purchaseDate,
      imageBlob,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
    })
    setSaving(false)
    navigate('/')
  }

  const onDelete = async () => {
    if (!id || isNew) return
    if (!confirm('移入回收站？之后可在「我的 → 回收站」恢复或彻底删除。')) return
    await softDeleteItem(id)
    navigate('/')
  }

  if (!ready) return null

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="page-title">{isNew ? '添加单品' : '编辑单品'}</h1>
      {!isNew && (
        <p className="page-sub">
          {wearCount > 0 ? `已记录穿着 ${wearCount} 次` : '尚未出现在穿着记录中'}
        </p>
      )}

      {preview && <img className="image-preview" src={preview} alt="预览" />}
      <ImagePicker onPick={onPick} />

      <div className="form-group">
        <label className="form-label" htmlFor="name">
          名称（可选）
        </label>
        <input
          id="name"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：白衬衫"
        />
      </div>

      <div className="form-group">
        <div className="form-label">分类</div>
        <div className="chip-select">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">颜色</div>
        <div className="chip-select">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${color === c ? ' active' : ''}`}
              onClick={() => setColor(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">季节</div>
        <div className="chip-select">
          {SEASONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip${season === s ? ' active' : ''}`}
              onClick={() => setSeason(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="brand">
          品牌
        </label>
        <input
          id="brand"
          className="form-input"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="可选"
        />
      </div>

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="price">
            价格
          </label>
          <input
            id="price"
            className="form-input"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="可选"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="size">
            尺码
          </label>
          <input
            id="size"
            className="form-input"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="S / M / 38…"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="location">
          收纳位置
        </label>
        <input
          id="location"
          className="form-input"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="例如：衣柜上层"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="tags">
          标签（空格或逗号分隔）
        </label>
        <input
          id="tags"
          className="form-input"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="通勤 基础款"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="purchaseDate">
          购买日期
        </label>
        <input
          id="purchaseDate"
          className="form-input"
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="notes">
          备注
        </label>
        <textarea
          id="notes"
          className="form-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="面料、洗涤说明…"
        />
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
