import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllItems, getAllWearLogs, saveItem, uid } from '../db'
import type { Category, ClothingItem, ColorName, Season } from '../types'
import { CATEGORIES, COLORS, SEASONS } from '../types'
import { ItemCard } from '../components/ItemCard'
import { EmptyState } from '../components/EmptyState'
import { TodaySuggest } from '../components/TodaySuggest'
import { buildWearCounts } from '../utils/wearStats'
import { loadSettings, saveSettings } from '../utils/settings'
import {
  filterAndSortItems,
  type SortKey,
} from '../utils/wardrobeQuery'
import { compressImage } from '../utils/image'
import { Toast } from '../components/Toast'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created', label: '最近添加' },
  { key: 'updated', label: '最近更新' },
  { key: 'wear', label: '穿着次数' },
  { key: 'name', label: '名称' },
]

export function Wardrobe() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [wearMap, setWearMap] = useState<Map<string, number>>(() => new Map())
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | '全部'>('全部')
  const [color, setColor] = useState<ColorName | '全部'>('全部')
  const [season, setSeason] = useState<Season | '全部'>('全部')
  const [sort, setSort] = useState<SortKey>('created')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [settings, setSettings] = useState(() => loadSettings())
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [batchBusy, setBatchBusy] = useState(false)
  const batchRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [list, logs] = await Promise.all([getAllItems(), getAllWearLogs()])
    setItems(list)
    const counts = buildWearCounts(logs)
    const map = new Map<string, number>()
    counts.forEach((v, k) => map.set(k, v.count))
    setWearMap(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () =>
      filterAndSortItems(items, {
        search,
        category,
        color,
        season,
        sort,
        seasonMode: settings.seasonMode,
        currentSeasonFilter: settings.currentSeasonFilter,
        wearCounts: wearMap,
      }),
    [items, search, category, color, season, sort, settings, wearMap],
  )


  const BATCH_CAP = 30

  const onBatchImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) {
      setToast('请选择图片文件')
      return
    }
    if (list.length > BATCH_CAP) {
      setToast(`一次最多导入 ${BATCH_CAP} 张，已选 ${list.length} 张`)
      return
    }
    setBatchBusy(true)
    let ok = 0
    for (let i = 0; i < list.length; i++) {
      setToast(`导入中 ${i + 1}/${list.length}…`)
      try {
        const imageBlob = await compressImage(list[i])
        const now = Date.now()
        await saveItem({
          id: uid(),
          name: '',
          category: '其他',
          color: '其他',
          season: '四季',
          notes: '',
          brand: '',
          price: null,
          size: '',
          location: '',
          tags: [],
          purchaseDate: '',
          imageBlob,
          originalBlob: imageBlob,
          createdAt: now + i,
          updatedAt: now + i,
          deletedAt: null,
        })
        ok++
      } catch {
        /* skip failed */
      }
    }
    setBatchBusy(false)
    setToast(`已导入 ${ok} 件单品`)
    await load()
  }

  const toggleSeasonMode = () => {
    const next = { ...settings, seasonMode: !settings.seasonMode }
    setSettings(next)
    saveSettings(next)
  }

  return (
    <div className="page-with-fab">
      <div className="page-head-row">
        <div>
          <h1 className="page-title">衣橱</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {items.length > 0 ? `${filtered.length} / ${items.length} 件` : '本地电子衣橱'}
          </p>
        </div>
        <button
          type="button"
          className={`chip${settings.seasonMode ? ' active' : ''}`}
          onClick={toggleSeasonMode}
          title="开启后只显示当前季节与四季"
        >
          {settings.seasonMode ? `季节 ${settings.currentSeasonFilter}` : '季节模式'}
        </button>
      </div>

      {!loading && items.length >= 2 && <TodaySuggest items={items} />}

      {items.length > 0 && (
        <>
          <input
            className="form-input search-input"
            type="search"
            placeholder="搜索名称、品牌、备注、标签…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            enterKeyHint="search"
          />

          <div className="filter-row">
            <button
              type="button"
              className={`chip${category === '全部' ? ' active' : ''}`}
              onClick={() => setCategory('全部')}
            >
              全部
            </button>
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

          <div className="toolbar-row">
            <select
              className="form-select sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="排序"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-text"
              onClick={() => setShowMoreFilters((v) => !v)}
            >
              {showMoreFilters ? '收起筛选' : '更多筛选'}
            </button>
          </div>

          {showMoreFilters && (
            <div className="more-filters">
              <div className="form-label">颜色</div>
              <div className="filter-row">
                <button
                  type="button"
                  className={`chip${color === '全部' ? ' active' : ''}`}
                  onClick={() => setColor('全部')}
                >
                  全部
                </button>
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
              <div className="form-label">季节标签</div>
              <div className="filter-row">
                <button
                  type="button"
                  className={`chip${season === '全部' ? ' active' : ''}`}
                  onClick={() => setSeason('全部')}
                >
                  全部
                </button>
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
          )}
        </>
      )}

      {loading ? null : filtered.length === 0 ? (
        <EmptyState
          icon="👗"
          title={items.length === 0 ? '衣橱还是空的' : '没有符合条件的单品'}
          description={
            items.length === 0
              ? '拍一张或从相册选一张，开始建立你的电子衣橱'
              : '试试清空搜索或调整筛选'
          }
          actionLabel={items.length === 0 ? '添加单品' : undefined}
          onAction={items.length === 0 ? () => navigate('/items/new') : undefined}
        />
      ) : (
        <div className="item-grid">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              wearCount={wearMap.get(item.id)}
              onClick={() => navigate(`/items/${item.id}`)}
            />
          ))}
        </div>
      )}

      <input
        ref={batchRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          void onBatchImport(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="fab-cluster">
        <button
          type="button"
          className="fab fab-secondary"
          aria-label="批量导入"
          disabled={batchBusy}
          onClick={() => batchRef.current?.click()}
        >
          多
        </button>
        <button
          type="button"
          className="fab"
          aria-label="添加单品"
          onClick={() => navigate('/items/new')}
        >
          +
        </button>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
