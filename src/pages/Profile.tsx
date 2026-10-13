import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAllData,
  countInspirations,
  countOutfits,
  countWearLogs,
  getAllInspirations,
  getAllItems,
  getAllOutfits,
  getAllWearLogs,
  importAllData,
  getAllWishlist,
} from '../db'
import {
  normalizeInspiration,
  normalizeItem,
  normalizeOutfit,
  normalizeWearLog,
  type BackupData,
  type BackupDataV6,
  type ClothingItem,
  type Inspiration,
  type Outfit,
  type SeasonFilter,
  type WearLog,
  type WishlistItem,
  normalizeWishlist,
  SEASON_FILTERS,
} from '../types'
import { base64ToBlob, blobToBase64 } from '../utils/image'
import { rankItemsByWear, type ItemWearStat } from '../utils/wearStats'
import { loadSettings, saveSettings, type AppSettings } from '../utils/settings'
import { WearInsight } from '../components/WearInsight'
import { Toast } from '../components/Toast'
import { openTaobao, openPinduoduo } from '../utils/shop'
import { downloadTextFile, itemsToCsv } from '../utils/csvExport'
import {
  formatYuan,
  summarizeWardrobeValue,
  summarizeWishlistValue,
  type WardrobeValueSummary,
} from '../utils/valueStats'

export function Profile() {
  const navigate = useNavigate()
  const [itemCount, setItemCount] = useState(0)
  const [outfitCount, setOutfitCount] = useState(0)
  const [logCount, setLogCount] = useState(0)
  const [inspCount, setInspCount] = useState(0)
  const [valueSummary, setValueSummary] = useState<WardrobeValueSummary | null>(null)
  const [wishEstimate, setWishEstimate] = useState({ openCount: 0, openEstimate: 0 })
  const [shopKw, setShopKw] = useState(() => loadSettings().shopSearchKeyword)
  const [top, setTop] = useState<ItemWearStat[]>([])
  const [forgotten, setForgotten] = useState<ItemWearStat[]>([])
  const [idleHighPrice, setIdleHighPrice] = useState<ItemWearStat[]>([])
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    const [items, logs, oc, lc, ic, wishlist] = await Promise.all([
      getAllItems(),
      getAllWearLogs(),
      countOutfits(),
      countWearLogs(),
      countInspirations(),
      getAllWishlist(),
    ])
    setItemCount(items.length)
    setOutfitCount(oc)
    setLogCount(lc)
    setInspCount(ic)
    const ranked = rankItemsByWear(items, logs)
    setTop(ranked.top)
    setForgotten(ranked.forgotten)
    setIdleHighPrice(ranked.idleHighPrice)
    setValueSummary(
      summarizeWardrobeValue(items, { includeRetired: loadSettings().includeRetiredInValue }),
    )
    setWishEstimate(summarizeWishlistValue(wishlist))
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSettings = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
    if ('includeRetiredInValue' in patch || 'shopSearchKeyword' in patch) {
      void refresh()
      if ('shopSearchKeyword' in patch) setShopKw(next.shopSearchKeyword)
    }
  }

  const exportBackup = async () => {
    setBusy(true)
    try {
      const [items, outfits, wearLogs, inspirations, wishlist] = await Promise.all([
        getAllItems(true),
        getAllOutfits(true),
        getAllWearLogs(),
        getAllInspirations(true),
        getAllWishlist(),
      ])
      const exportedItems = await Promise.all(
        items.map(async (it) => {
          const { imageBlob, originalBlob, extraImages, ...rest } = it
          return {
            ...rest,
            imageBase64: await blobToBase64(imageBlob),
            originalBase64: originalBlob ? await blobToBase64(originalBlob) : undefined,
            extraImagesBase64: extraImages?.length
              ? await Promise.all(extraImages.map((b) => blobToBase64(b)))
              : undefined,
          }
        }),
      )
      const exportedOutfits = await Promise.all(
        outfits.map(async (o) => {
          const { coverBlob, ...rest } = o
          return {
            ...rest,
            coverBase64: coverBlob ? await blobToBase64(coverBlob) : undefined,
          }
        }),
      )
      const exportedLogs = await Promise.all(
        wearLogs.map(async (l) => {
          const { photoBlob, ...rest } = l
          return {
            ...rest,
            photoBase64: photoBlob ? await blobToBase64(photoBlob) : undefined,
          }
        }),
      )
      const exportedInsp = await Promise.all(
        inspirations.map(async (i) => {
          const { imageBlob, ...rest } = i
          return { ...rest, imageBase64: await blobToBase64(imageBlob) }
        }),
      )
      const exportedWish = await Promise.all(
        wishlist.map(async (w) => {
          const { imageBlob, ...rest } = w
          return {
            ...rest,
            imageBase64: imageBlob ? await blobToBase64(imageBlob) : undefined,
          }
        }),
      )
      const data: BackupDataV6 = {
        version: 6,
        exportedAt: new Date().toISOString(),
        items: exportedItems,
        outfits: exportedOutfits,
        wearLogs: exportedLogs,
        inspirations: exportedInsp,
        subcategoryTaxonomy: loadSettings().subcategoryTaxonomy,
        wishlist: exportedWish,
      }
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qing-yichu-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setToast('备份已导出')
    } catch {
      setToast('导出失败')
    }
    setBusy(false)
  }

  const importBackup = async (file: File) => {
    setBusy(true)
    try {
      const data = JSON.parse(await file.text()) as BackupData
      if (!data || ![1, 2, 3, 4, 5, 6].includes(data.version) || !Array.isArray(data.items)) {
        throw new Error('invalid')
      }
      if (
        !confirm(
          `将导入 ${data.items.length} 件单品、${data.outfits?.length ?? 0} 套搭配。同 ID 会覆盖，确定继续？`,
        )
      ) {
        setBusy(false)
        return
      }
      const items: ClothingItem[] = await Promise.all(
        data.items.map(async (it) => {
          const raw = it as {
            imageBase64: string
            originalBase64?: string
            extraImagesBase64?: string[]
          } & ClothingItem
          const { imageBase64, originalBase64, extraImagesBase64, ...rest } = raw
          return normalizeItem({
            ...(rest as ClothingItem),
            imageBlob: await base64ToBlob(imageBase64),
            originalBlob: originalBase64 ? await base64ToBlob(originalBase64) : undefined,
            extraImages: extraImagesBase64?.length
              ? await Promise.all(extraImagesBase64.map((b) => base64ToBlob(b)))
              : [],
            createdAt: (rest as ClothingItem).createdAt ?? Date.now(),
            updatedAt: (rest as ClothingItem).updatedAt ?? Date.now(),
            category: (rest as ClothingItem).category,
            color: (rest as ClothingItem).color,
            season: (rest as ClothingItem).season,
            id: (rest as ClothingItem).id,
          })
        }),
      )
      const outfits = await Promise.all(
        (data.outfits ?? []).map(async (o) => {
          const raw = o as Outfit & { coverBase64?: string }
          const { coverBase64, ...rest } = raw
          return normalizeOutfit({
            ...rest,
            coverBlob: coverBase64 ? await base64ToBlob(coverBase64) : rest.coverBlob,
          })
        }),
      )
      const wearLogs: WearLog[] = await Promise.all(
        (data.wearLogs ?? []).map(async (l) => {
          const photoBase64 = 'photoBase64' in l ? l.photoBase64 : undefined
          const { photoBase64: _p, ...rest } = l as WearLog & { photoBase64?: string }
          return normalizeWearLog({
            ...rest,
            photoBlob: photoBase64 ? await base64ToBlob(photoBase64) : undefined,
            id: rest.id,
            date: rest.date,
            itemIds: rest.itemIds ?? [],
            createdAt: rest.createdAt ?? Date.now(),
          })
        }),
      )
      let inspirations: Inspiration[] = []
      if ((data.version === 2 || data.version === 3 || data.version === 4 || data.version === 5 || data.version === 6) && 'inspirations' in data && Array.isArray(data.inspirations)) {
        inspirations = await Promise.all(
          data.inspirations.map(async (i) => {
            const { imageBase64, ...rest } = i
            return normalizeInspiration({
              ...rest,
              imageBlob: await base64ToBlob(imageBase64),
              id: rest.id,
              createdAt: rest.createdAt,
              updatedAt: rest.updatedAt,
            })
          }),
        )
      }
      let wishlistRows: WishlistItem[] = []
      if (data.version === 6 && 'wishlist' in data && Array.isArray(data.wishlist)) {
        wishlistRows = await Promise.all(
          data.wishlist.map(async (w) => {
            const { imageBase64, ...rest } = w
            return normalizeWishlist({
              ...rest,
              imageBlob: imageBase64 ? await base64ToBlob(imageBase64) : undefined,
              id: rest.id,
              createdAt: rest.createdAt,
              updatedAt: rest.updatedAt,
            })
          }),
        )
      }
      await importAllData(items, outfits, wearLogs, inspirations, wishlistRows)
      if ((data.version === 5 || data.version === 6) && 'subcategoryTaxonomy' in data && data.subcategoryTaxonomy) {
        const cur = loadSettings()
        const merged = { ...cur.subcategoryTaxonomy }
        for (const [k, list] of Object.entries(data.subcategoryTaxonomy)) {
          if (!Array.isArray(list)) continue
          const prev = merged[k as keyof typeof merged] ?? []
          merged[k as keyof typeof merged] = [...new Set([...prev, ...list.map((s) => String(s).trim()).filter(Boolean)])]
        }
        const next = { ...cur, subcategoryTaxonomy: merged }
        saveSettings(next)
        setSettings(next)
      }
      await refresh()
      setToast('导入成功')
    } catch {
      setToast('导入失败，请检查备份文件')
    }
    setBusy(false)
  }

  const exportCsv = async () => {
    setBusy(true)
    try {
      const items = await getAllItems(true)
      downloadTextFile(
        `qing-yichu-items-${new Date().toISOString().slice(0, 10)}.csv`,
        itemsToCsv(items),
      )
      setToast('CSV 已导出')
    } catch {
      setToast('导出失败')
    }
    setBusy(false)
  }

  const clearData = async () => {
    if (!confirm('确定清空全部数据？请先导出备份。')) return
    if (!confirm('再次确认：真的要清空吗？')) return
    await clearAllData()
    await refresh()
    setToast('已清空全部数据')
  }

  return (
    <div>
      <h1 className="page-title">我的</h1>
      <p className="page-sub">数据只存在你的手机里</p>

      <div className="stat-grid stat-grid-4">
        <div className="stat-card">
          <div className="stat-num">{itemCount}</div>
          <div className="stat-label">单品</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{outfitCount}</div>
          <div className="stat-label">搭配</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{logCount}</div>
          <div className="stat-label">穿着</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{inspCount}</div>
          <div className="stat-label">灵感</div>
        </div>
      </div>

      <section className="insight-section">
        <h3 className="insight-title">当前季节</h3>
        <p className="insight-hint">开启季节模式后，衣橱默认显示该季节与四季单品</p>
        <label className="toggle-row">
          <span>季节模式</span>
          <input
            type="checkbox"
            checked={settings.seasonMode}
            onChange={(e) => updateSettings({ seasonMode: e.target.checked })}
          />
        </label>
        <label className="toggle-row">
          <span>换季提醒</span>
          <input
            type="checkbox"
            checked={settings.seasonReminder}
            onChange={(e) => updateSettings({ seasonReminder: e.target.checked })}
          />
        </label>
        <div className="chip-select" style={{ marginTop: 10 }}>
          {SEASON_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip${settings.currentSeasonFilter === s ? ' active' : ''}`}
              onClick={() => updateSettings({ currentSeasonFilter: s as SeasonFilter })}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      
      {valueSummary && valueSummary.itemCount > 0 && (
        <section className="insight-section value-section">
          <h3 className="insight-title">衣橱估值</h3>
          <div className="value-hero">{formatYuan(valueSummary.totalValue)}</div>
          <p className="insight-hint">
            {valueSummary.itemCount} 件 · {valueSummary.pricedCount} 件有价 · 均价{' '}
            {valueSummary.pricedCount ? formatYuan(valueSummary.avgPrice) : '—'}
          </p>
          <label className="toggle-row">
            <span>含已淘汰</span>
            <input
              type="checkbox"
              checked={settings.includeRetiredInValue}
              onChange={(e) => updateSettings({ includeRetiredInValue: e.target.checked })}
            />
          </label>
          {wishEstimate.openCount > 0 && (
            <p className="insight-hint" style={{ marginTop: 8 }}>
              想买未购 {wishEstimate.openCount} 件
              {wishEstimate.openEstimate > 0 ? ` · 备注估价约 ${formatYuan(wishEstimate.openEstimate)}` : ''}
            </p>
          )}
          <div className="value-cat-list">
            {valueSummary.byCategory.map((row) => (
              <button
                key={row.category}
                type="button"
                className="value-cat-row"
                onClick={() => navigate(`/?category=${encodeURIComponent(row.category)}`)}
              >
                <span>{row.label}</span>
                <span className="value-cat-meta">
                  {row.count} 件
                  {row.pricedCount ? ` · ${formatYuan(row.total)}` : ''}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="insight-section">
        <h3 className="insight-title">购物</h3>
        <p className="insight-hint">快捷打开淘宝 / 拼多多（优先唤起 App，失败则打开网页）</p>
        <div className="form-group">
          <label className="form-label">默认搜索词（可选）</label>
          <input
            className="form-input"
            value={shopKw}
            onChange={(e) => setShopKw(e.target.value)}
            onBlur={() => updateSettings({ shopSearchKeyword: shopKw.trim() })}
            placeholder="例如：白衬衫"
          />
        </div>
        <div className="shop-actions-row">
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openTaobao(shopKw)}>
            打开淘宝
          </button>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => openPinduoduo(shopKw)}>
            打开拼多多
          </button>
        </div>
      </section>

      {itemCount > 0 && <WearInsight top={top} forgotten={forgotten} idleHighPrice={idleHighPrice} />}

      <div className="menu-list">
        <button type="button" className="menu-item" onClick={() => navigate('/wishlist')}>
          <span>想买</span>
          <span>心愿单</span>
        </button>
        <button type="button" className="menu-item" onClick={() => navigate('/laundry')}>
          <span>待洗</span>
          <span>洗衣篮</span>
        </button>
        <button type="button" className="menu-item" onClick={() => navigate('/categories')}>
          <span>管理分类</span>
          <span>子分类</span>
        </button>
        <button type="button" className="menu-item" onClick={() => navigate('/recycle')}>
          <span>回收站</span>
          <span>恢复 / 彻底删除</span>
        </button>
        <button type="button" className="menu-item" disabled={busy} onClick={() => void exportBackup()}>
          <span>导出备份</span>
          <span>JSON v6</span>
        </button>
        <button type="button" className="menu-item" disabled={busy} onClick={() => void exportCsv()}>
          <span>导出单品 CSV</span>
          <span>表格</span>
        </button>
        <button type="button" className="menu-item" disabled={busy} onClick={() => fileRef.current?.click()}>
          <span>导入备份</span>
          <span>支持 v1–v6</span>
        </button>
        <button type="button" className="menu-item" onClick={() => void clearData()}>
          <span style={{ color: 'var(--danger)' }}>清空全部数据</span>
          <span />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void importBackup(f)
          e.target.value = ''
        }}
      />

      <div className="help-box">
        <h4>如何添加到主屏幕？</h4>
        <p style={{ marginBottom: 8 }}>把「轻衣橱」装到手机桌面，像 App 一样打开。</p>
        <ol>
          <li>
            <strong>iPhone（Safari）</strong>：分享 →「添加到主屏幕」
          </li>
          <li>
            <strong>Android（Chrome）</strong>：菜单 →「添加到主屏幕」
          </li>
        </ol>
        <p style={{ marginTop: 12, color: 'var(--muted)' }}>
          数据保存在本机 IndexedDB。换机前请导出备份。升级后旧数据会自动补全新字段。
        </p>
      </div>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.75rem', color: 'var(--muted)' }}>
        轻衣橱 v2.0
      </p>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
