import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  SEASONS,
  normalizeColorHex,
  type Category,
  type Season,
} from '../types'
import { formatSeasons, toggleSeason } from '../utils/seasons'
import { getAllWearLogs, getItem, saveItem, softDeleteItem, uid } from '../db'
import { buildWearCounts } from '../utils/wearStats'
import { compressImage } from '../utils/image'
import { ImagePicker } from '../components/ImagePicker'
import { ImageEditor } from '../components/ImageEditor'
import { Toast } from '../components/Toast'
import { SubcategoryPicker } from '../components/SubcategoryPicker'
import { ColorPicker } from '../components/ColorPicker'
import { addSubcategoryLabel, loadSettings, saveSettings } from '../utils/settings'

export function ItemForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const presetCategory = searchParams.get('category')

  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('上衣')
  const [subcategory, setSubcategory] = useState('')
  const [color, setColor] = useState('#1c1916')
  const [seasons, setSeasons] = useState<Season[]>(['四季'])
  const [notes, setNotes] = useState('')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [size, setSize] = useState('')
  const [location, setLocation] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchaseLink, setPurchaseLink] = useState('')
  const [tempMin, setTempMin] = useState('')
  const [tempMax, setTempMax] = useState('')
  const [status, setStatus] = useState<'使用中' | '闲置' | '收纳中' | '已淘汰'>('使用中')
  const [needsWash, setNeedsWash] = useState(false)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [ready, setReady] = useState(isNew)
  const [wearCount, setWearCount] = useState(0)

  useEffect(() => {
    if (isNew && presetCategory && (CATEGORIES as readonly string[]).includes(presetCategory)) {
      setCategory(presetCategory as Category)
    }
  }, [isNew, presetCategory])

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
      setSubcategory(item.subcategory ?? '')
      setColor(normalizeColorHex(item.color))
      setSeasons(item.seasons?.length ? item.seasons : ['四季'])
      setNotes(item.notes)
      setBrand(item.brand)
      setPrice(item.price != null ? String(item.price) : '')
      setSize(item.size)
      setLocation(item.location)
      setTagsText(item.tags.join(' '))
      setPurchaseDate(item.purchaseDate)
      setPurchaseLink(item.purchaseLink ?? '')
      setTempMin(item.tempMin != null ? String(item.tempMin) : '')
      setTempMax(item.tempMax != null ? String(item.tempMax) : '')
      setStatus(item.status)
      setNeedsWash(Boolean(item.needsWash))
      setImageBlob(item.imageBlob)
      setOriginalBlob(item.originalBlob ?? null)
      const logs = await getAllWearLogs()
      setWearCount(buildWearCounts(logs).get(item.id)?.count ?? 0)
      setReady(true)
    })()
  }, [id, isNew, navigate])

  const onPick = async (file: File) => {
    try {
      const compressed = await compressImage(file)
      setOriginalBlob(compressed)
      setImageBlob(compressed)
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
    const savedId = existing?.id ?? uid()
    await saveItem({
      id: savedId,
      name: name.trim(),
      category,
      subcategory: subcategory.trim(),
      color: normalizeColorHex(color),
      seasons,
      notes: notes.trim(),
      brand: brand.trim(),
      price: priceNum != null && !Number.isNaN(priceNum) ? priceNum : null,
      size: size.trim(),
      location: location.trim(),
      tags: parseTags(tagsText),
      purchaseDate: purchaseDate,
      purchaseLink: purchaseLink.trim(),
      imageBlob,
      originalBlob: originalBlob ?? undefined,
      extraImages: existing?.extraImages ?? [],
      tempMin: tempMin.trim() === '' ? null : Number(tempMin),
      tempMax: tempMax.trim() === '' ? null : Number(tempMax),
      status,
      needsWash,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
    })
    setSaving(false)
    navigate(`/items/${savedId}`, { replace: true })
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

      {imageBlob ? (
        <ImageEditor
          blob={imageBlob}
          originalBlob={originalBlob}
          onChange={setImageBlob}
          onOriginalChange={setOriginalBlob}
        />
      ) : null}
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
              onClick={() => {
                setCategory(c)
                setSubcategory('')
              }}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">子分类</div>
        <SubcategoryPicker
          category={category}
          value={subcategory}
          onChange={(v) => {
            setSubcategory(v)
            if (v) {
              const s = addSubcategoryLabel(loadSettings(), category, v)
              saveSettings(s)
            }
          }}
        />
      </div>

      <div className="form-group">
        <div className="form-label">颜色</div>
        <ColorPicker value={color} onChange={setColor} sampleBlob={imageBlob} />
      </div>

      <div className="form-group">
        <div className="form-label">季节（可多选）</div>
        <p className="insight-hint" style={{ marginTop: 0, marginBottom: 8 }}>
          点「四季」表示全年；选具体季节会取消四季。当前：{formatSeasons(seasons)}
        </p>
        <div className="chip-select">
          {SEASONS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip${seasons.includes(s) ? ' active' : ''}`}
              onClick={() => setSeasons((prev) => toggleSeason(prev, s))}
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
            价格（¥）
          </label>
          <div className="price-input-wrap">
            <span className="price-prefix">¥</span>
            <input
              id="price"
              className="form-input price-input"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
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
        <label className="form-label" htmlFor="purchaseLink">
          购买链接
        </label>
        <input
          id="purchaseLink"
          className="form-input"
          value={purchaseLink}
          onChange={(e) => setPurchaseLink(e.target.value)}
          placeholder="淘宝 / 拼多多商品链接"
          inputMode="url"
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

      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor="tmin">适合温度最低 °C</label>
          <input id="tmin" className="form-input" inputMode="numeric" value={tempMin} onChange={(e) => setTempMin(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="tmax">最高 °C</label>
          <input id="tmax" className="form-input" inputMode="numeric" value={tempMax} onChange={(e) => setTempMax(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <div className="form-label">状态</div>
        <div className="chip-select">
          {(['使用中', '闲置', '收纳中', '已淘汰'] as const).map((s) => (
            <button key={s} type="button" className={`chip${status === s ? ' active' : ''}`} onClick={() => setStatus(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <label className="toggle-row" style={{ marginBottom: 16 }}>
        <span>待洗</span>
        <input type="checkbox" checked={needsWash} onChange={(e) => setNeedsWash(e.target.checked)} />
      </label>

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
