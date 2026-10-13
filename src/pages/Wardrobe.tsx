import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllItems, getAllWearLogs, getItem, saveItem, softDeleteItem, uid } from '../db'
import type { Category, ClothingItem, ColorName, Season } from '../types'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  COLORS,
  CORE_CATEGORIES,
  SEASONS,
} from '../types'
import { ItemCard } from '../components/ItemCard'
import { EmptyState } from '../components/EmptyState'
import { TodaySuggest } from '../components/TodaySuggest'
import { BatchEditSheet, type BatchPatch } from '../components/BatchEditSheet'
import { buildWearCounts } from '../utils/wearStats'
import { loadSettings, saveSettings } from '../utils/settings'
import { filterAndSortItems, type SortKey } from '../utils/wardrobeQuery'
import { compressImage } from '../utils/image'
import { Toast } from '../components/Toast'
import { useBlobUrl } from '../hooks/useBlobUrl'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'created', label: '最近添加' },
  { key: 'updated', label: '最近更新' },
  { key: 'wear', label: '穿着次数' },
  { key: 'name', label: '名称' },
]

const BATCH_CAP = 30
const VIEW_KEY = 'qing-yichu-wardrobe-view'

type ViewMode = 'grouped' | 'grid'

function loadView(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'grid' ? 'grid' : 'grouped'
  } catch {
    return 'grouped'
  }
}

function GroupThumb({ item, onClick }: { item: ClothingItem; onClick: () => void }) {
  const url = useBlobUrl(item.imageBlob)
  return (
    <button type="button" className="group-thumb" onClick={onClick}>
      {url ? <img src={url} alt={item.name || item.category} /> : <div className="group-thumb-ph" />}
    </button>
  )
}

export function Wardrobe() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [wearMap, setWearMap] = useState<Map<string, number>>(() => new Map())
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [category, setCategory] = useState<Category | '全部'>('全部')
  const [color, setColor] = useState<ColorName | '全部'>('全部')
  const [season, setSeason] = useState<Season | '全部'>('全部')
  const [sort, setSort] = useState<SortKey>('created')
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [settings, setSettings] = useState(() => loadSettings())
  const [view, setView] = useState<ViewMode>(() => loadView())
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [batchBusy, setBatchBusy] = useState(false)
  const batchRef = useRef<HTMLInputElement>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [showBatchEdit, setShowBatchEdit] = useState(false)

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

  const setViewMode = (m: ViewMode) => {
    setView(m)
    localStorage.setItem(VIEW_KEY, m)
  }

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

  const sections = useMemo(() => {
    const byCat = new Map<Category, ClothingItem[]>()
    for (const c of CATEGORIES) byCat.set(c, [])
    for (const it of filtered) {
      byCat.get(it.category)?.push(it)
    }
    const result: { cat: Category; list: ClothingItem[] }[] = []
    for (const c of CORE_CATEGORIES) {
      result.push({ cat: c, list: byCat.get(c) ?? [] })
    }
    for (const c of CATEGORIES) {
      if (CORE_CATEGORIES.includes(c)) continue
      const list = byCat.get(c) ?? []
      if (list.length > 0) result.push({ cat: c, list })
    }
    return result
  }, [filtered])

  const exitSelect = () => {
    setSelectMode(false)
    setSelected(new Set())
    setShowBatchEdit(false)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onBatchImport = async (files: FileList | null) => {
    if (!files?.length) return
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) {
      setToast('请选择图片文件')
      return
    }
    if (list.length > BATCH_CAP) {
      setToast(`一次最多导入 ${BATCH_CAP} 张`)
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
          extraImages: [],
          tempMin: null,
          tempMax: null,
          status: '使用中',
          createdAt: now + i,
          updatedAt: now + i,
          deletedAt: null,
        })
        ok++
      } catch {
        /* skip */
      }
    }
    setBatchBusy(false)
    await load()
    setToast(`已导入 ${ok} 件。点「选择」可批量改分类`)
  }

  const applyBatchPatch = async (patch: BatchPatch) => {
    const ids = [...selected]
    const now = Date.now()
    for (const id of ids) {
      const item = await getItem(id)
      if (!item || item.deletedAt) continue
      const tags =
        patch.addTags?.length ? Array.from(new Set([...item.tags, ...patch.addTags])) : item.tags
      await saveItem({
        ...item,
        category: patch.category ?? item.category,
        season: patch.season ?? item.season,
        color: patch.color ?? item.color,
        brand: patch.brand !== undefined ? patch.brand : item.brand,
        location: patch.location !== undefined ? patch.location : item.location,
        size: patch.size !== undefined ? patch.size : item.size,
        tags,
        updatedAt: now,
      })
    }
    exitSelect()
    await load()
    setToast(`已更新 ${ids.length} 件`)
  }

  const batchSoftDelete = async () => {
    const ids = [...selected]
    if (!ids.length) return
    if (!confirm(`将 ${ids.length} 件移入回收站？`)) return
    for (const id of ids) await softDeleteItem(id)
    exitSelect()
    await load()
    setToast(`已移入回收站 ${ids.length} 件`)
  }

  return (
    <div className={`page-with-fab${selectMode ? ' page-selecting' : ''}`}>
      <header className="wardrobe-topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label="切换视图"
          onClick={() => setViewMode(view === 'grouped' ? 'grid' : 'grouped')}
        >
          {view === 'grouped' ? '▦' : '☰'}
        </button>
        <h1 className="wardrobe-title">我的衣橱</h1>
        <div className="wardrobe-topbar-right">
          <button
            type="button"
            className="icon-btn"
            aria-label="搜索"
            onClick={() => setShowSearch((v) => !v)}
          >
            ⌕
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="更多"
            onClick={() => setShowMoreMenu((v) => !v)}
          >
            ⋯
          </button>
        </div>
      </header>

      {showMoreMenu && (
        <div className="more-menu">
          <button
            type="button"
            onClick={() => {
              setShowMoreMenu(false)
              selectMode ? exitSelect() : (setSelectMode(true), setSelected(new Set()))
            }}
          >
            {selectMode ? '退出选择' : '选择'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowMoreMenu(false)
              const next = { ...settings, seasonMode: !settings.seasonMode }
              setSettings(next)
              saveSettings(next)
              setToast(next.seasonMode ? `季节模式：${next.currentSeasonFilter}` : '已关闭季节模式')
            }}
          >
            季节模式
          </button>
          <button
            type="button"
            disabled={batchBusy}
            onClick={() => {
              setShowMoreMenu(false)
              batchRef.current?.click()
            }}
          >
            批量导入
          </button>
          <button type="button" onClick={() => { setShowMoreMenu(false); navigate('/me') }}>
            我的 / 回收站
          </button>
        </div>
      )}

      {showSearch && (
        <input
          className="form-input search-input"
          type="search"
          placeholder="搜索名称、品牌、备注、标签…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      )}

      {!loading && !selectMode && view === 'grid' && items.length >= 2 && (
        <TodaySuggest items={items} />
      )}

      {selectMode && (
        <div className="toolbar-row">
          <button type="button" className="btn-text" onClick={() => setSelected(new Set(filtered.map((i) => i.id)))}>
            全选当前列表
          </button>
          <button type="button" className="btn-text" onClick={() => setSelected(new Set())}>
            清空选择
          </button>
          <span className="page-sub" style={{ margin: 0 }}>
            已选 {selected.size}
          </span>
        </div>
      )}

      {view === 'grid' && items.length > 0 && !selectMode && (
        <>
          <div className="filter-row">
            <button type="button" className={`chip${category === '全部' ? ' active' : ''}`} onClick={() => setCategory('全部')}>
              全部
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className={`chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
                {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="toolbar-row">
            <select className="form-select sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <button type="button" className="btn-text" onClick={() => setShowMoreFilters((v) => !v)}>
              {showMoreFilters ? '收起筛选' : '更多筛选'}
            </button>
          </div>
          {showMoreFilters && (
            <div className="more-filters">
              <div className="form-label">颜色</div>
              <div className="filter-row">
                <button type="button" className={`chip${color === '全部' ? ' active' : ''}`} onClick={() => setColor('全部')}>全部</button>
                {COLORS.map((c) => (
                  <button key={c} type="button" className={`chip${color === c ? ' active' : ''}`} onClick={() => setColor(c)}>{c}</button>
                ))}
              </div>
              <div className="form-label">季节</div>
              <div className="filter-row">
                <button type="button" className={`chip${season === '全部' ? ' active' : ''}`} onClick={() => setSeason('全部')}>全部</button>
                {SEASONS.map((s) => (
                  <button key={s} type="button" className={`chip${season === s ? ' active' : ''}`} onClick={() => setSeason(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loading ? null : items.length === 0 ? (
        <EmptyState
          icon="👗"
          title="衣橱还是空的"
          description="拍一张或从相册选一张，开始建立你的电子衣橱"
          actionLabel="添加单品"
          onAction={() => navigate('/items/new')}
        />
      ) : view === 'grouped' && !selectMode ? (
        <div className="category-sections">
          {sections.map(({ cat, list }) => (
            <section key={cat} className="category-card">
              <div className="category-card-head">
                <button
                  type="button"
                  className="category-card-title"
                  onClick={() => {
                    setViewMode('grid')
                    setCategory(cat)
                  }}
                >
                  {CATEGORY_LABEL[cat]}
                  <span className="category-count">({list.length})</span>
                  <span className="attr-chevron">›</span>
                </button>
                <div className="category-card-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`添加${CATEGORY_LABEL[cat]}`}
                    onClick={() => navigate(`/items/new?category=${encodeURIComponent(cat)}`)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="category-rail">
                {list.length === 0 ? (
                  <button
                    type="button"
                    className="group-thumb group-thumb-empty"
                    onClick={() => navigate(`/items/new?category=${encodeURIComponent(cat)}`)}
                  >
                    +
                  </button>
                ) : (
                  list.map((it) => (
                    <GroupThumb key={it.id} item={it} onClick={() => navigate(`/items/${it.id}`)} />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="👗" title="没有符合条件的单品" description="试试调整筛选" />
      ) : (
        <div className="item-grid">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              wearCount={wearMap.get(item.id)}
              selectMode={selectMode}
              selected={selected.has(item.id)}
              onClick={() =>
                selectMode ? toggleSelect(item.id) : navigate(`/items/${item.id}`)
              }
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

      {selectMode ? (
        <div className="batch-action-bar">
          <button type="button" className="btn btn-secondary" disabled={!selected.size} onClick={() => setShowBatchEdit(true)}>
            批量修改
          </button>
          <button type="button" className="btn btn-danger" disabled={!selected.size} onClick={() => void batchSoftDelete()}>
            移入回收站
          </button>
          <button type="button" className="btn btn-ghost" onClick={exitSelect}>
            取消
          </button>
        </div>
      ) : (
        <div className="fab-cluster">
          <button type="button" className="fab" aria-label="添加单品" onClick={() => navigate('/items/new')}>
            +
          </button>
        </div>
      )}

      {showBatchEdit && selected.size > 0 && (
        <BatchEditSheet
          count={selected.size}
          onClose={() => setShowBatchEdit(false)}
          onApply={(p) => void applyBatchPatch(p)}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
