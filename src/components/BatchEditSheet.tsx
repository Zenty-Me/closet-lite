import { useState, type ReactNode } from 'react'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  COLORS,
  SEASONS,
  type Category,
  type ColorName,
  type Season,
} from '../types'
import { SubcategoryPicker } from './SubcategoryPicker'
import { addSubcategoryLabel, loadSettings, saveSettings } from '../utils/settings'

export interface BatchPatch {
  category?: Category
  subcategory?: string
  season?: Season
  color?: ColorName
  brand?: string
  location?: string
  size?: string
  /** Tags to merge into each item (additive) */
  addTags?: string[]
}

interface Props {
  count: number
  onApply: (patch: BatchPatch) => void
  onClose: () => void
}

export function BatchEditSheet({ count, onApply, onClose }: Props) {
  const [enableCategory, setEnableCategory] = useState(false)
  const [enableSubcategory, setEnableSubcategory] = useState(false)
  const [enableSeason, setEnableSeason] = useState(false)
  const [enableColor, setEnableColor] = useState(false)
  const [enableBrand, setEnableBrand] = useState(false)
  const [enableLocation, setEnableLocation] = useState(false)
  const [enableSize, setEnableSize] = useState(false)
  const [enableTags, setEnableTags] = useState(false)

  const [category, setCategory] = useState<Category>('上衣')
  const [subcategory, setSubcategory] = useState('')
  const [season, setSeason] = useState<Season>('四季')
  const [color, setColor] = useState<ColorName>('黑')
  const [brand, setBrand] = useState('')
  const [location, setLocation] = useState('')
  const [size, setSize] = useState('')
  const [tagsText, setTagsText] = useState('')

  const apply = () => {
    const patch: BatchPatch = {}
    if (enableCategory) patch.category = category
    if (enableSubcategory) patch.subcategory = subcategory.trim()
    if (enableSeason) patch.season = season
    if (enableColor) patch.color = color
    if (enableBrand) patch.brand = brand.trim()
    if (enableLocation) patch.location = location.trim()
    if (enableSize) patch.size = size.trim()
    if (enableTags) {
      const tags = tagsText
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
      if (tags.length) patch.addTags = tags
    }
    if (Object.keys(patch).length === 0) return
    onApply(patch)
  }

  const hasAny =
    enableCategory ||
    enableSubcategory ||
    enableSeason ||
    enableColor ||
    enableBrand ||
    enableLocation ||
    enableSize ||
    enableTags

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">批量修改 · {count} 件</div>
        <p className="insight-hint">只勾选要改的字段；未勾选的保持各单品原值</p>

        <FieldToggle label="分类" on={enableCategory} setOn={setEnableCategory}>
          <div className="chip-select">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip${category === c ? ' active' : ''}`}
                onClick={() => { setCategory(c); setSubcategory('') }}
              >
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </FieldToggle>

        <FieldToggle label="子分类" on={enableSubcategory} setOn={setEnableSubcategory}>
          <p className="insight-hint" style={{ marginBottom: 8 }}>
            按上方「分类」字段所属主类选子分类；若同时改分类，请先勾选分类
          </p>
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
        </FieldToggle>

        <FieldToggle label="季节" on={enableSeason} setOn={setEnableSeason}>
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
        </FieldToggle>

        <FieldToggle label="颜色" on={enableColor} setOn={setEnableColor}>
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
        </FieldToggle>

        <FieldToggle label="品牌" on={enableBrand} setOn={setEnableBrand}>
          <input
            className="form-input"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="统一设为…"
          />
        </FieldToggle>

        <FieldToggle label="收纳位置" on={enableLocation} setOn={setEnableLocation}>
          <input
            className="form-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="统一设为…"
          />
        </FieldToggle>

        <FieldToggle label="尺码" on={enableSize} setOn={setEnableSize}>
          <input
            className="form-input"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="统一设为…"
          />
        </FieldToggle>

        <FieldToggle label="追加标签" on={enableTags} setOn={setEnableTags}>
          <input
            className="form-input"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="空格或逗号分隔，合并到已有标签"
          />
        </FieldToggle>

        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!hasAny}
          onClick={apply}
          style={{ marginTop: 12 }}
        >
          应用到 {count} 件
        </button>
      </div>
    </div>
  )
}

function FieldToggle({
  label,
  on,
  setOn,
  children,
}: {
  label: string
  on: boolean
  setOn: (v: boolean) => void
  children: ReactNode
}) {
  return (
    <div className="batch-field">
      <label className="batch-field-head">
        <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <span>修改{label}</span>
      </label>
      {on && <div className="batch-field-body">{children}</div>}
    </div>
  )
}
