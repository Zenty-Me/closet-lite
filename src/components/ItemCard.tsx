import type { ClothingItem } from '../types'
import { colorLabel } from '../types'
import { useBlobUrl } from '../hooks/useBlobUrl'

interface Props {
  item: ClothingItem
  onClick: () => void
  wearCount?: number
  selectMode?: boolean
  selected?: boolean
}

export function ItemCard({ item, onClick, wearCount, selectMode, selected }: Props) {
  const url = useBlobUrl(item.imageBlob)
  const subtitle = [item.brand, item.category, colorLabel(item.color)].filter(Boolean).join('  ')
  return (
    <button
      type="button"
      className={`item-card${selectMode && selected ? ' selected' : ''}`}
      onClick={onClick}
      aria-pressed={selectMode ? selected : undefined}
    >
      <div className="item-card-img-wrap">
        {url ? (
          <img className="item-card-img" src={url} alt={item.name || item.category} />
        ) : (
          <div className="item-card-img" />
        )}
        {typeof wearCount === 'number' && wearCount > 0 && !selectMode && (
          <span className="wear-pill">穿 {wearCount}</span>
        )}
        {selectMode && (
          <span className={`select-check${selected ? ' on' : ''}`} aria-hidden>
            {selected ? '✓' : ''}
          </span>
        )}
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{item.name || item.category}</div>
        <div className="item-card-meta">{subtitle}</div>
      </div>
    </button>
  )
}
