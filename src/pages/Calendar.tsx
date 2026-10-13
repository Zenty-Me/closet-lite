import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getAllItems,
  getAllOutfits,
  getItemsByIds,
  getOutfit,
  getWearLogByDate,
  getWearLogsInMonth,
  saveWearLog,
  deleteWearLog,
  uid,
} from '../db'
import type { ClothingItem, Outfit, WearLog } from '../types'
import {
  WEEKDAYS,
  daysInMonth,
  firstWeekday,
  formatDate,
  todayStr,
} from '../utils/date'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { Toast } from '../components/Toast'
import { compressImage } from '../utils/image'
import { ImagePicker } from '../components/ImagePicker'

function Thumb({ item }: { item: ClothingItem }) {
  const url = useBlobUrl(item.imageBlob)
  return url ? <img className="outfit-thumb" src={url} alt="" /> : <div className="outfit-thumb" />
}

function PhotoPreview({ blob }: { blob?: Blob }) {
  const url = useBlobUrl(blob ?? null)
  if (!url) return null
  return <img className="wear-photo" src={url} alt="今日穿搭照" />
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

export function Calendar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const seedItem = searchParams.get('item')
  const seedConsumed = useRef(false)
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState<'month' | 'week'>('month')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(today))
  const [selected, setSelected] = useState(todayStr())
  const [logs, setLogs] = useState<WearLog[]>([])
  const [dayLog, setDayLog] = useState<WearLog | undefined>()
  const [dayItems, setDayItems] = useState<ClothingItem[]>([])
  const [dayOutfit, setDayOutfit] = useState<Outfit | undefined>()
  const [showPicker, setShowPicker] = useState(false)
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [allItems, setAllItems] = useState<ClothingItem[]>([])
  const [pickMode, setPickMode] = useState<'outfit' | 'items'>('outfit')
  const [pickedItems, setPickedItems] = useState<string[]>([])
  const [pickedOutfit, setPickedOutfit] = useState('')
  const [note, setNote] = useState('')
  const [weather, setWeather] = useState('')
  const [photoBlob, setPhotoBlob] = useState<Blob | undefined>()
  const [toast, setToast] = useState('')

  const loadLogs = useCallback(async () => {
    if (view === 'month') {
      setLogs(await getWearLogsInMonth(year, month))
    } else {
      const start = formatDate(weekAnchor)
      const endDate = new Date(weekAnchor)
      endDate.setDate(endDate.getDate() + 6)
      const end = formatDate(endDate)
      const all = await getWearLogsInMonth(
        weekAnchor.getFullYear(),
        weekAnchor.getMonth() + 1,
      )
      // also next month spill
      const next = new Date(weekAnchor)
      next.setDate(next.getDate() + 6)
      const all2 =
        next.getMonth() !== weekAnchor.getMonth()
          ? await getWearLogsInMonth(next.getFullYear(), next.getMonth() + 1)
          : []
      const merged = [...all, ...all2].filter((l) => l.date >= start && l.date <= end)
      setLogs(merged)
    }
  }, [view, year, month, weekAnchor])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  useEffect(() => {
    void (async () => {
      const log = await getWearLogByDate(selected)
      setDayLog(log)
      if (log) {
        setDayItems(await getItemsByIds(log.itemIds))
        setDayOutfit(log.outfitId ? await getOutfit(log.outfitId) : undefined)
      } else {
        setDayItems([])
        setDayOutfit(undefined)
      }
    })()
  }, [selected, logs])

  const logDates = useMemo(() => new Set(logs.map((l) => l.date)), [logs])

  const monthCells = useMemo(() => {
    const total = daysInMonth(year, month)
    const start = firstWeekday(year, month)
    const result: Array<{ day: number; date: string; inMonth: boolean }> = []
    for (let i = 0; i < start; i++) result.push({ day: 0, date: '', inMonth: false })
    for (let d = 1; d <= total; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      result.push({ day: d, date, inMonth: true })
    }
    return result
  }, [year, month])

  const weekCells = useMemo(() => {
    const cells: Array<{ day: number; date: string; inMonth: boolean }> = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() + i)
      cells.push({
        day: d.getDate(),
        date: formatDate(d),
        inMonth: true,
      })
    }
    return cells
  }, [weekAnchor])

  const prev = () => {
    if (view === 'month') {
      if (month === 1) {
        setYear((y) => y - 1)
        setMonth(12)
      } else setMonth((m) => m - 1)
    } else {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() - 7)
      setWeekAnchor(d)
    }
  }

  const next = () => {
    if (view === 'month') {
      if (month === 12) {
        setYear((y) => y + 1)
        setMonth(1)
      } else setMonth((m) => m + 1)
    } else {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() + 7)
      setWeekAnchor(d)
    }
  }

  const headerLabel =
    view === 'month'
      ? `${year}年${month}月`
      : `${formatDate(weekAnchor).slice(5)} – ${formatDate(
          (() => {
            const e = new Date(weekAnchor)
            e.setDate(e.getDate() + 6)
            return e
          })(),
        ).slice(5)}`

  const openPicker = async (opts?: { seedItemId?: string | null }) => {
    setOutfits(await getAllOutfits())
    setAllItems(await getAllItems())
    const seed = opts?.seedItemId
    if (seed) {
      setPickMode('items')
      setPickedItems([seed])
      setPickedOutfit('')
    } else {
      setPickMode('outfit')
      setPickedItems(dayLog?.itemIds ?? [])
      setPickedOutfit(dayLog?.outfitId ?? '')
    }
    setNote(dayLog?.note ?? '')
    setWeather(dayLog?.weather ?? '')
    setPhotoBlob(dayLog?.photoBlob)
    setShowPicker(true)
  }

  useEffect(() => {
    if (!seedItem || seedConsumed.current) return
    seedConsumed.current = true
    void openPicker({ seedItemId: seedItem }).then(() => {
      const next = new URLSearchParams(searchParams)
      next.delete('item')
      setSearchParams(next, { replace: true })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedItem])

  const saveLog = async () => {
    let itemIds = pickedItems
    let outfitId: string | undefined
    if (pickMode === 'outfit') {
      if (!pickedOutfit) {
        setToast('请选择一套搭配')
        return
      }
      const o = outfits.find((x) => x.id === pickedOutfit)
      if (!o) return
      itemIds = o.itemIds
      outfitId = o.id
    } else if (itemIds.length === 0) {
      setToast('请至少选择一件单品')
      return
    }
    await saveWearLog({
      id: dayLog?.id ?? uid(),
      date: selected,
      outfitId,
      itemIds,
      note: note.trim(),
      weather: weather.trim(),
      photoBlob,
      createdAt: dayLog?.createdAt ?? Date.now(),
    })
    setShowPicker(false)
    setToast('已记录穿着')
    await loadLogs()
  }

  const removeLog = async () => {
    if (!dayLog) return
    if (!confirm('清除这一天的穿着记录？')) return
    await deleteWearLog(dayLog.id)
    setToast('已清除')
    await loadLogs()
  }

  const cells = view === 'month' ? monthCells : weekCells

  return (
    <div>
      <h1 className="page-title">日历</h1>
      <p className="page-sub">记录每天穿了什么</p>

      <div className="filter-row" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={`chip${view === 'month' ? ' active' : ''}`}
          onClick={() => setView('month')}
        >
          月视图
        </button>
        <button
          type="button"
          className={`chip${view === 'week' ? ' active' : ''}`}
          onClick={() => {
            setView('week')
            setWeekAnchor(startOfWeek(new Date(selected + 'T12:00:00')))
          }}
        >
          周视图
        </button>
      </div>

      <div className="cal-header">
        <button type="button" className="cal-nav-btn" onClick={prev} aria-label="上一段">
          ‹
        </button>
        <h2>{headerLabel}</h2>
        <button type="button" className="cal-nav-btn" onClick={next} aria-label="下一段">
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className={`cal-grid${view === 'week' ? ' cal-grid-week' : ''}`}>
        {cells.map((c, i) =>
          !c.inMonth && view === 'month' ? (
            <div key={`e-${i}`} className="cal-day other" />
          ) : (
            <button
              key={c.date || i}
              type="button"
              className={`cal-day${c.date === todayStr() ? ' today' : ''}${
                c.date === selected ? ' selected' : ''
              }`}
              onClick={() => setSelected(c.date)}
            >
              {c.day}
              {logDates.has(c.date) && <span className="dot" />}
            </button>
          ),
        )}
      </div>

      <div className="cal-detail">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>
          {selected === todayStr() ? '今天' : selected}
        </div>
        {dayLog ? (
          <>
            {dayLog.weather && (
              <div style={{ fontSize: '0.875rem', marginBottom: 6, color: 'var(--muted)' }}>
                天气：{dayLog.weather}
              </div>
            )}
            {dayOutfit && (
              <div style={{ fontSize: '0.875rem', marginBottom: 8 }}>搭配：{dayOutfit.name}</div>
            )}
            <PhotoPreview blob={dayLog.photoBlob} />
            <div className="outfit-thumbs" style={{ marginBottom: 12 }}>
              {dayItems.map((it) => (
                <Thumb key={it.id} item={it} />
              ))}
            </div>
            {dayLog.note && <p className="notes">{dayLog.note}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => void openPicker()}>
                修改
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void removeLog()}>
                清除
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: 12 }}>
              这一天还没有穿着记录
            </p>
            <button type="button" className="btn btn-primary btn-block" onClick={() => void openPicker()}>
              记录穿着
            </button>
          </>
        )}
      </div>

      {showPicker && (
        <div className="overlay" onClick={() => setShowPicker(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">记录 {selected}</div>

            <div className="filter-row">
              <button
                type="button"
                className={`chip${pickMode === 'outfit' ? ' active' : ''}`}
                onClick={() => setPickMode('outfit')}
              >
                选搭配
              </button>
              <button
                type="button"
                className={`chip${pickMode === 'items' ? ' active' : ''}`}
                onClick={() => setPickMode('items')}
              >
                选单品
              </button>
            </div>

            {pickMode === 'outfit' ? (
              outfits.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>还没有搭配，可切换到「选单品」</p>
              ) : (
                <div className="outfit-list">
                  {outfits.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="outfit-card"
                      style={{
                        borderColor: pickedOutfit === o.id ? 'var(--accent)' : undefined,
                        borderWidth: pickedOutfit === o.id ? 2 : 1,
                      }}
                      onClick={() => setPickedOutfit(o.id)}
                    >
                      <div className="outfit-card-title">
                        {pickedOutfit === o.id ? '✓ ' : ''}
                        {o.name}
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : allItems.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>衣橱还是空的</p>
            ) : (
              <div className="picker-grid">
                {allItems.map((it) => (
                  <PickItem
                    key={it.id}
                    item={it}
                    selected={pickedItems.includes(it.id)}
                    onToggle={() =>
                      setPickedItems((prev) =>
                        prev.includes(it.id) ? prev.filter((x) => x !== it.id) : [...prev, it.id],
                      )
                    }
                  />
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label" htmlFor="weather">天气（可选）</label>
              <input
                id="weather"
                className="form-input"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                placeholder="晴 22℃ / 下雨…"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="wnote">备注</label>
              <input
                id="wnote"
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="心情、场合…"
              />
            </div>
            <div className="form-group">
              <div className="form-label">今日穿搭照（可选）</div>
              {photoBlob && <PhotoPreview blob={photoBlob} />}
              <ImagePicker
                onPick={async (f) => {
                  try {
                    setPhotoBlob(await compressImage(f))
                  } catch {
                    setToast('图片处理失败')
                  }
                }}
              />
              {photoBlob && (
                <button type="button" className="btn-text" onClick={() => setPhotoBlob(undefined)}>
                  移除照片
                </button>
              )}
            </div>

            <button type="button" className="btn btn-primary btn-block" onClick={() => void saveLog()}>
              保存记录
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

function PickItem({
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
    <button type="button" className={`picker-item${selected ? ' selected' : ''}`} onClick={onToggle}>
      {url && <img src={url} alt="" />}
      {selected && <span className="picker-check">✓</span>}
    </button>
  )
}
