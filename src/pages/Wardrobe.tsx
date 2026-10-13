import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllItems, getAllWearLogs } from '../db'
import type { ClothingItem, Category } from '../types'
import { CATEGORIES } from '../types'
import { ItemCard } from '../components/ItemCard'
import { EmptyState } from '../components/EmptyState'
import { TodaySuggest } from '../components/TodaySuggest'
import { buildWearCounts } from '../utils/wearStats'

export function Wardrobe() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ClothingItem[]>([])
  const [wearMap, setWearMap] = useState<Map<string, { count: number; lastWorn: string }>>(
    () => new Map(),
  )
  const [filter, setFilter] = useState<Category | '全部'>('全部')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [list, logs] = await Promise.all([getAllItems(), getAllWearLogs()])
    setItems(list)
    setWearMap(buildWearCounts(logs))
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () => (filter === '全部' ? items : items.filter((i) => i.category === filter)),
    [filter, items],
  )

  return (
    <div className="page-with-fab">
      <h1 className="page-title">衣橱</h1>
      <p className="page-sub">
        {items.length > 0 ? `共 ${items.length} 件单品` : '本地电子衣橱'}
      </p>

      {!loading && items.length >= 2 && <TodaySuggest items={items} />}

      {items.length > 0 && (
        <div className="filter-row">
          <button
            type="button"
            className={`chip${filter === '全部' ? ' active' : ''}`}
            onClick={() => setFilter('全部')}
          >
            全部
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${filter === c ? ' active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? null : filtered.length === 0 ? (
        <EmptyState
          icon="👗"
          title={items.length === 0 ? '衣橱还是空的' : '没有这类单品'}
          description={
            items.length === 0
              ? '拍一张或从相册选一张，开始建立你的电子衣橱'
              : '试试切换其他分类，或添加新单品'
          }
          actionLabel="添加单品"
          onAction={() => navigate('/items/new')}
        />
      ) : (
        <div className="item-grid">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              wearCount={wearMap.get(item.id)?.count}
              onClick={() => navigate(`/items/${item.id}`)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="fab"
        aria-label="添加单品"
        onClick={() => navigate('/items/new')}
      >
        +
      </button>
    </div>
  )
}
