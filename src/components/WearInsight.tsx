import { useNavigate } from 'react-router-dom'
import type { ItemWearStat } from '../utils/wearStats'
import { useBlobUrl } from '../hooks/useBlobUrl'

function Row({
  stat,
  badge,
  onClick,
}: {
  stat: ItemWearStat
  badge: string
  onClick: () => void
}) {
  const url = useBlobUrl(stat.item.imageBlob)
  return (
    <button type="button" className="insight-row" onClick={onClick}>
      {url ? (
        <img className="insight-avatar" src={url} alt="" />
      ) : (
        <div className="insight-avatar" />
      )}
      <div className="insight-info">
        <div className="insight-name">{stat.item.name || stat.item.category}</div>
        <div className="insight-meta">
          {stat.item.category}
          {stat.lastWorn ? `，最近 ${stat.lastWorn}` : '，从未穿过'}
        </div>
      </div>
      <span className="insight-badge">{badge}</span>
    </button>
  )
}

interface Props {
  top: ItemWearStat[]
  forgotten: ItemWearStat[]
}

export function WearInsight({ top, forgotten }: Props) {
  const navigate = useNavigate()

  if (top.length === 0 && forgotten.length === 0) return null

  return (
    <div className="insight-block">
      {top.length > 0 && (
        <section className="insight-section">
          <h3 className="insight-title">常穿单品</h3>
          <div className="insight-list">
            {top.map((s) => (
              <Row
                key={s.item.id}
                stat={s}
                badge={`${s.count} 次`}
                onClick={() => navigate(`/items/${s.item.id}`)}
              />
            ))}
          </div>
        </section>
      )}
      {forgotten.length > 0 && (
        <section className="insight-section">
          <h3 className="insight-title">衣柜角落</h3>
          <p className="insight-hint">很少或从未出现在穿着记录里的单品</p>
          <div className="insight-list">
            {forgotten.map((s) => (
              <Row
                key={s.item.id}
                stat={s}
                badge={s.count === 0 ? '未穿' : `${s.count} 次`}
                onClick={() => navigate(`/items/${s.item.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
