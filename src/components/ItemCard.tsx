import type { ClothingItem } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'

interface Props {
  item: ClothingItem
  onClick: () => void
  wearCount?: number
}

export function ItemCard({ item, onClick, wearCount }: Props) {
  const url = useBlobUrl(item.imageBlob)
  return (
    <button type="button" className="item-card" onClick={onClick}>
      <div className="item-card-img-wrap">
        {url ? (
          <img className="item-card-img" src={url} alt={item.name || item.category} />
        ) : (
          <div className="item-card-img" />
        )}
        {typeof wearCount === 'number' && wearCount > 0 && (
          <span className="wear-pill">穿 {wearCount}</span>
        )}
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{item.name || item.category}</div>
        <div className="item-card-meta">
          {item.category}  {item.color}  {item.season}
        </div>
      </div>
    </button>
  )
}
