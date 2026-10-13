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
import { deleteItem, getItem, saveItem, uid } from '../db'
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
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [ready, setReady] = useState(isNew)

  const preview = useBlobUrl(imageBlob)

  useEffect(() => {
    if (isNew) return
    void (async () => {
      const item = await getItem(id!)
      if (!item) {
        navigate('/')
        return
      }
      setName(item.name)
      setCategory(item.category)
      setColor(item.color)
      setSeason(item.season)
      setNotes(item.notes)
      setImageBlob(item.imageBlob)
      setReady(true)
    })()
  }, [id, isNew, navigate])

  const onPick = async (file: File) => {
    try {
      const blob = await compressImage(file)
      setImageBlob(blob)
    } catch {
      setToast('图片处理失败，请重试')
    }
  }

  const onSave = async () => {
    if (!imageBlob) {
      setToast('请先添加一张照片')
      return
    }
    setSaving(true)
    const now = Date.now()
    const existing = !isNew ? await getItem(id!) : undefined
    await saveItem({
      id: existing?.id ?? uid(),
      name: name.trim(),
      category,
      color,
      season,
      notes: notes.trim(),
      imageBlob,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    setSaving(false)
    navigate('/')
  }

  const onDelete = async () => {
    if (!id || isNew) return
    if (!confirm('确定删除这件单品？相关搭配中的引用也会移除。')) return
    await deleteItem(id)
    navigate('/')
  }

  if (!ready) return null

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="page-title">{isNew ? '添加单品' : '编辑单品'}</h1>

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
        <label className="form-label" htmlFor="notes">
          备注
        </label>
        <textarea
          id="notes"
          className="form-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="品牌、尺码、购买地点…"
        />
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
