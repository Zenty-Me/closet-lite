import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getAllWearLogs,
  getItem,
  saveItem,
  softDeleteItem,
  uid,
} from '../db'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  colorLabel,
  ITEM_STATUSES,
  normalizeColorHex,
  SEASONS,
  type ClothingItem,
  type ItemStatus,
  type Season,
} from '../types'
import { buildWearCounts } from '../utils/wearStats'
import { compressImage } from '../utils/image'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { ImageEditor } from '../components/ImageEditor'
import { ImagePicker } from '../components/ImagePicker'
import { Toast } from '../components/Toast'
import { openPurchaseLink, openTaobao, openPinduoduo } from '../utils/shop'
import { formatYuan } from '../utils/valueStats'
import { SubcategoryPicker } from '../components/SubcategoryPicker'
import { ColorPicker } from '../components/ColorPicker'
import { addSubcategoryLabel, loadSettings, saveSettings } from '../utils/settings'

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [wearCount, setWearCount] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [editImage, setEditImage] = useState(false)
  const [fieldEdit, setFieldEdit] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const mainUrl = useBlobUrl(item?.imageBlob ?? null)
  const extraRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!id) return
    const row = await getItem(id)
    if (!row || row.deletedAt) {
      navigate('/', { replace: true })
      return
    }
    setItem(row)
    const logs = await getAllWearLogs()
    setWearCount(buildWearCounts(logs).get(row.id)?.count ?? 0)
  }, [id, navigate])

  useEffect(() => {
    void load()
  }, [load])

  const patch = async (partial: Partial<ClothingItem>) => {
    if (!item) return
    const next = { ...item, ...partial, updatedAt: Date.now() }
    await saveItem(next)
    setItem(next)
    setFieldEdit(null)
    setToast('已保存')
  }

  const onDelete = async () => {
    if (!item) return
    if (!confirm('移入回收站？可在「我的 → 回收站」恢复。')) return
    await softDeleteItem(item.id)
    navigate('/', { replace: true })
  }

  const duplicate = async () => {
    if (!item) return
    const now = Date.now()
    const copy: ClothingItem = {
      ...item,
      id: uid(),
      name: item.name ? `${item.name} 副本` : '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      imageBlob: item.imageBlob,
      originalBlob: item.originalBlob,
      extraImages: [...item.extraImages],
    }
    await saveItem(copy)
    setToast('已复制')
    navigate(`/items/${copy.id}`, { replace: true })
  }

  const addExtra = async (file: File) => {
    if (!item) return
    try {
      const blob = await compressImage(file)
      await patch({ extraImages: [...item.extraImages, blob] })
    } catch {
      setToast('图片添加失败')
    }
  }

  const removeExtra = async (index: number) => {
    if (!item) return
    const next = item.extraImages.filter((_, i) => i !== index)
    await patch({ extraImages: next })
  }

  if (!item) return null

  const tempLabel =
    item.tempMin != null || item.tempMax != null
      ? `${item.tempMin ?? '—'}°C ~ ${item.tempMax ?? '—'}°C`
      : '未设置'

  return (
    <div className="item-detail-page">
      <header className="detail-topbar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          ←
        </button>
        <h1>单品</h1>
        <div className="detail-topbar-right">
          <button
            type="button"
            className="icon-btn"
            onClick={() => navigate(`/items/${item.id}/edit`)}
            aria-label="完整编辑"
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="detail-hero">
        {mainUrl ? (
          <img src={mainUrl} alt={item.name || item.category} />
        ) : (
          <div className="detail-hero-empty" />
        )}
        <button type="button" className="detail-hero-chip" onClick={() => setGalleryOpen(true)}>
          更多图片
          {item.extraImages.length > 0 ? ` ${item.extraImages.length}` : ''}
        </button>
        <button
          type="button"
          className="detail-hero-edit"
          aria-label="编辑图片"
          onClick={() => setEditImage(true)}
        >
          ✎
        </button>
      </div>

      {wearCount > 0 && (
        <p className="page-sub" style={{ padding: '0 4px' }}>
          已记录穿着 {wearCount} 次
        </p>
      )}

      <div className="attr-list">
        <AttrRow label="名称" value={item.name || '输入名称'} muted={!item.name} onClick={() => setFieldEdit('name')} />
        <AttrRow
          label="分类"
          value={CATEGORY_LABEL[item.category]}
          onClick={() => setFieldEdit('category')}
        />
        <AttrRow
          label="子分类"
          value={item.subcategory || '未分子类'}
          muted={!item.subcategory}
          onClick={() => setFieldEdit('subcategory')}
        />
        <AttrRow
          label="颜色"
          value={colorLabel(item.color)}
          swatch={normalizeColorHex(item.color)}
          onClick={() => setFieldEdit('color')}
        />
        <AttrRow label="季节" value={item.season || '未设置'} onClick={() => setFieldEdit('season')} />
        <AttrRow label="适合温度" value={tempLabel} onClick={() => setFieldEdit('temp')} />
        <AttrRow
          label="收纳位置"
          value={item.location || '未设置'}
          muted={!item.location}
          onClick={() => setFieldEdit('location')}
        />
        <AttrRow
          label="状态"
          value={item.status}
          status={item.status}
          onClick={() => setFieldEdit('status')}
        />
        <AttrRow
          label="待洗"
          value={item.needsWash ? '待洗' : '干净'}
          muted={!item.needsWash}
          onClick={() => void patch({ needsWash: !item.needsWash })}
        />
        <AttrRow
          label="价格"
          value={item.price != null ? formatYuan(item.price) : '未设置'}
          muted={item.price == null}
          onClick={() => setFieldEdit('price')}
        />
        <AttrRow
          label="购买链接"
          value={item.purchaseLink ? '已设置' : '未设置'}
          muted={!item.purchaseLink}
          onClick={() => setFieldEdit('purchaseLink')}
        />
      </div>

      <div className="shop-actions">
        {item.purchaseLink ? (
          <button type="button" className="btn btn-primary btn-block" onClick={() => openPurchaseLink(item.purchaseLink)}>
            打开购买链接
          </button>
        ) : null}
        <div className="shop-actions-row">
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => openTaobao(item.name || item.brand || CATEGORY_LABEL[item.category])}
          >
            打开淘宝
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => openPinduoduo(item.name || item.brand || CATEGORY_LABEL[item.category])}
          >
            打开拼多多
          </button>
        </div>
      </div>

      <div className="detail-action-bar">
        <button
          type="button"
          className="detail-action"
          onClick={() => navigate(`/outfits/new?item=${item.id}`)}
        >
          <span className="detail-action-ico">▣</span>
          创建搭配
        </button>
        <button
          type="button"
          className="detail-action"
          onClick={() => navigate(`/calendar?item=${item.id}`)}
        >
          <span className="detail-action-ico">▦</span>
          日历
        </button>
        <button type="button" className="detail-action" onClick={() => void duplicate()}>
          <span className="detail-action-ico">⧉</span>
          复制
        </button>
        <button type="button" className="detail-action danger" onClick={() => void onDelete()}>
          <span className="detail-action-ico">⌫</span>
          删除
        </button>
      </div>

      {editImage && (
        <div className="overlay" onClick={() => setEditImage(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">编辑主图</div>
            <ImageEditor
              blob={item.imageBlob}
              originalBlob={item.originalBlob}
              onChange={(b) => void patch({ imageBlob: b })}
              onOriginalChange={(b) => void patch({ originalBlob: b })}
            />
            <ImagePicker
              onPick={async (f) => {
                try {
                  const b = await compressImage(f)
                  await patch({ imageBlob: b, originalBlob: b })
                } catch {
                  setToast('替换失败')
                }
              }}
            />
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setEditImage(false)}>
              完成
            </button>
          </div>
        </div>
      )}

      {galleryOpen && (
        <div className="overlay" onClick={() => setGalleryOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">更多图片</div>
            <div className="gallery-grid">
              {item.extraImages.map((blob, i) => (
                <GalleryThumb key={i} blob={blob} onRemove={() => void removeExtra(i)} />
              ))}
              <button
                type="button"
                className="gallery-add"
                onClick={() => extraRef.current?.click()}
              >
                +
              </button>
            </div>
            <input
              ref={extraRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void addExtra(f)
                e.target.value = ''
              }}
            />
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setGalleryOpen(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {fieldEdit && (
        <FieldSheet
          field={fieldEdit}
          item={item}
          onClose={() => setFieldEdit(null)}
          onSave={(partial) => void patch(partial)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

function GalleryThumb({ blob, onRemove }: { blob: Blob; onRemove: () => void }) {
  const url = useBlobUrl(blob)
  return (
    <div className="gallery-thumb">
      {url && <img src={url} alt="" />}
      <button type="button" className="gallery-remove" onClick={onRemove}>
        ×
      </button>
    </div>
  )
}

function AttrRow({
  label,
  value,
  muted,
  swatch,
  status,
  onClick,
}: {
  label: string
  value: string
  muted?: boolean
  swatch?: string
  status?: ItemStatus
  onClick: () => void
}) {
  return (
    <button type="button" className="attr-row" onClick={onClick}>
      <span className="attr-label">{label}</span>
      <span className={`attr-value${muted ? ' muted' : ''}`}>
        {swatch && <span className="color-swatch" style={{ background: swatch }} />}
        {status && <span className={`status-pill status-${status}`}>{value}</span>}
        {!status && value}
      </span>
      <span className="attr-chevron">›</span>
    </button>
  )
}

function FieldSheet({
  field,
  item,
  onClose,
  onSave,
}: {
  field: string
  item: ClothingItem
  onClose: () => void
  onSave: (p: Partial<ClothingItem>) => void
}) {
  const [name, setName] = useState(item.name)
  const [location, setLocation] = useState(item.location)
  const [tMin, setTMin] = useState(item.tempMin != null ? String(item.tempMin) : '')
  const [tMax, setTMax] = useState(item.tempMax != null ? String(item.tempMax) : '')

  const titleMap: Record<string, string> = {
    name: '名称',
    category: '分类',
    subcategory: '子分类',
    color: '颜色',
    season: '季节',
    temp: '适合温度',
    location: '收纳位置',
    status: '状态',
    price: '价格',
    purchaseLink: '购买链接',
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{titleMap[field] ?? '编辑'}</div>

        {field === 'name' && (
          <>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => onSave({ name: name.trim() })}>
              保存
            </button>
          </>
        )}
        {field === 'location' && (
          <>
            <input className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} autoFocus />
            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => onSave({ location: location.trim() })}>
              保存
            </button>
          </>
        )}
        {field === 'category' && (
          <div className="chip-select">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip${item.category === c ? ' active' : ''}`}
                onClick={() => onSave({ category: c, subcategory: c === item.category ? item.subcategory : '' })}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        )}
        {field === 'subcategory' && (
          <SubcategoryPicker
            category={item.category}
            value={item.subcategory}
            onChange={(v) => {
              if (v) {
                const s = addSubcategoryLabel(loadSettings(), item.category, v)
                saveSettings(s)
              }
              onSave({ subcategory: v })
            }}
          />
        )}
        {field === 'color' && (
          <ColorPicker
            value={item.color}
            onChange={(hex) => onSave({ color: hex })}
            sampleBlob={item.imageBlob}
          />
        )}
        {field === 'season' && (
          <div className="chip-select">
            {SEASONS.map((s) => (
              <button key={s} type="button" className={`chip${item.season === s ? ' active' : ''}`} onClick={() => onSave({ season: s as Season })}>
                {s}
              </button>
            ))}
          </div>
        )}
        {field === 'status' && (
          <div className="chip-select">
            {ITEM_STATUSES.map((s) => (
              <button key={s} type="button" className={`chip${item.status === s ? ' active' : ''}`} onClick={() => onSave({ status: s })}>
                {s}
              </button>
            ))}
          </div>
        )}
        {field === 'price' && (
          <>
            <div className="price-input-wrap">
              <span className="price-prefix">¥</span>
              <input
                className="form-input price-input"
                inputMode="decimal"
                defaultValue={item.price != null ? String(item.price) : ''}
                id="edit-price"
                autoFocus
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 12 }}
              onClick={() => {
                const v = (document.getElementById('edit-price') as HTMLInputElement)?.value.trim() ?? ''
                if (v === '') onSave({ price: null })
                else {
                  const n = Number(v)
                  onSave({ price: Number.isNaN(n) ? null : n })
                }
              }}
            >
              保存
            </button>
          </>
        )}
        {field === 'purchaseLink' && (
          <>
            <input
              className="form-input"
              defaultValue={item.purchaseLink}
              id="edit-plink"
              placeholder="https://"
              autoFocus
            />
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ marginTop: 12 }}
              onClick={() => {
                const v = (document.getElementById('edit-plink') as HTMLInputElement)?.value.trim() ?? ''
                onSave({ purchaseLink: v })
              }}
            >
              保存
            </button>
          </>
        )}
        {field === 'temp' && (
          <>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">最低 °C</label>
                <input className="form-input" inputMode="numeric" value={tMin} onChange={(e) => setTMin(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">最高 °C</label>
                <input className="form-input" inputMode="numeric" value={tMax} onChange={(e) => setTMax(e.target.value)} />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() =>
                onSave({
                  tempMin: tMin.trim() === '' ? null : Number(tMin),
                  tempMax: tMax.trim() === '' ? null : Number(tMax),
                })
              }
            >
              保存
            </button>
          </>
        )}
      </div>
    </div>
  )
}
