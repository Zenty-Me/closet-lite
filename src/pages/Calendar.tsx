import { useCallback, useEffect, useMemo, useState } from 'react'
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
  todayStr,
} from '../utils/date'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { Toast } from '../components/Toast'

function Thumb({ item }: { item: ClothingItem }) {
  const url = useBlobUrl(item.imageBlob)
  return url ? (
    <img className="outfit-thumb" src={url} alt="" />
  ) : (
    <div className="outfit-thumb" />
  )
}

export function Calendar() {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
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
  const [pickedOutfit, setPickedOutfit] = useState<string>('')
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')

  const loadMonth = useCallback(async () => {
    setLogs(await getWearLogsInMonth(year, month))
  }, [year, month])

  useEffect(() => {
    void loadMonth()
  }, [loadMonth])

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

  const cells = useMemo(() => {
    const total = daysInMonth(year, month)
    const start = firstWeekday(year, month)
    const result: Array<{ day: number; date: string; inMonth: boolean }> = []
    for (let i = 0; i < start; i++) {
      result.push({ day: 0, date: '', inMonth: false })
    }
    for (let d = 1; d <= total; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      result.push({ day: d, date, inMonth: true })
    }
    return result
  }, [year, month])

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else setMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else setMonth((m) => m + 1)
  }

  const openPicker = async () => {
    setOutfits(await getAllOutfits())
    setAllItems(await getAllItems())
    setPickMode('outfit')
    setPickedItems(dayLog?.itemIds ?? [])
    setPickedOutfit(dayLog?.outfitId ?? '')
    setNote(dayLog?.note ?? '')
    setShowPicker(true)
  }

  const saveLog = async () => {
    let itemIds = pickedItems
    let outfitId: string | undefined = undefined

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
      createdAt: dayLog?.createdAt ?? Date.now(),
    })
    setShowPicker(false)
    setToast('已记录穿着')
    await loadMonth()
  }

  const removeLog = async () => {
    if (!dayLog) return
    if (!confirm('清除这一天的穿着记录？')) return
    await deleteWearLog(dayLog.id)
    setToast('已清除')
    await loadMonth()
  }

  return (
    <div>
      <h1 className="page-title">日历</h1>
      <p className="page-sub">记录每天穿了什么</p>

      <div className="cal-header">
        <button type="button" className="cal-nav-btn" onClick={prevMonth} aria-label="上个月">
          ‹
        </button>
        <h2>
          {year}年{month}月
        </h2>
        <button type="button" className="cal-nav-btn" onClick={nextMonth} aria-label="下个月">
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((c, i) =>
          !c.inMonth ? (
            <div key={`e-${i}`} className="cal-day other" />
          ) : (
            <button
              key={c.date}
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
        <div style={{ fontWeight: 700, marginBottom: 10 }}>
          {selected === todayStr() ? '今天' : selected}
        </div>
        {dayLog ? (
          <>
            {dayOutfit && (
              <div style={{ fontSize: '0.875rem', marginBottom: 8 }}>
                搭配：{dayOutfit.name}
              </div>
            )}
            <div className="outfit-thumbs" style={{ marginBottom: 12 }}>
              {dayItems.map((it) => (
                <Thumb key={it.id} item={it} />
              ))}
            </div>
            {dayLog.note && (
              <p className="notes">{dayLog.note}</p>
            )}
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
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 12 }}>
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
            <div className="sheet-title">记录 {selected} 的穿着</div>

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
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  还没有搭配，可切换到「选单品」
                </p>
              ) : (
                <div className="outfit-list">
                  {outfits.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="outfit-card"
                      style={{
                        borderColor:
                          pickedOutfit === o.id ? 'var(--primary)' : undefined,
                        borderWidth: pickedOutfit === o.id ? 2 : 1,
                      }}
                      onClick={() => setPickedOutfit(o.id)}
                    >
                      <div className="outfit-card-title">
                        {pickedOutfit === o.id ? '✓ ' : ''}
                        {o.name}
                      </div>
                      {o.occasion && (
                        <div className="outfit-card-occ">{o.occasion}</div>
                      )}
                    </button>
                  ))}
                </div>
              )
            ) : allItems.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                衣橱还是空的，先去添加单品吧
              </p>
            ) : (
              <div className="picker-grid">
                {allItems.map((it) => (
                  <PickItem
                    key={it.id}
                    item={it}
                    selected={pickedItems.includes(it.id)}
                    onToggle={() =>
                      setPickedItems((prev) =>
                        prev.includes(it.id)
                          ? prev.filter((x) => x !== it.id)
                          : [...prev, it.id],
                      )
                    }
                  />
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label" htmlFor="wnote">
                备注（可选）
              </label>
              <input
                id="wnote"
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="天气、心情…"
              />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => void saveLog()}
            >
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
    <button
      type="button"
      className={`picker-item${selected ? ' selected' : ''}`}
      onClick={onToggle}
    >
      {url && <img src={url} alt="" />}
      {selected && <span className="picker-check">✓</span>}
    </button>
  )
}
