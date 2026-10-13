import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllInspirations } from '../db'
import type { Inspiration } from '../types'
import { EmptyState } from '../components/EmptyState'
import { useBlobUrl } from '../hooks/useBlobUrl'

function Card({ insp, onClick }: { insp: Inspiration; onClick: () => void }) {
  const url = useBlobUrl(insp.imageBlob)
  return (
    <button type="button" className="item-card" onClick={onClick}>
      <div className="item-card-img-wrap">
        {url ? <img className="item-card-img" src={url} alt="" /> : <div className="item-card-img" />}
      </div>
      <div className="item-card-body">
        <div className="item-card-name">{insp.note || '无备注'}</div>
        <div className="item-card-meta">
          {insp.tags.length ? insp.tags.slice(0, 3).join(' ') : '灵感'}
        </div>
      </div>
    </button>
  )
}

export function Inspire() {
  const navigate = useNavigate()
  const [list, setList] = useState<Inspiration[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setList(await getAllInspirations())
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="page-with-fab">
      <h1 className="page-title">灵感</h1>
      <p className="page-sub">
        收藏穿搭灵感
        <button type="button" className="btn-text" style={{ minHeight: 'auto', padding: '0 0 0 8px' }} onClick={() => navigate('/wishlist')}>
          想买
        </button>
      </p>

      {loading ? null : list.length === 0 ? (
        <EmptyState
          icon="💡"
          title="还没有灵感"
          description="从相册或拍照收藏一张好看的穿搭参考"
          actionLabel="添加灵感"
          onAction={() => navigate('/inspire/new')}
        />
      ) : (
        <div className="item-grid">
          {list.map((insp) => (
            <Card key={insp.id} insp={insp} onClick={() => navigate(`/inspire/${insp.id}`)} />
          ))}
        </div>
      )}

      <button
        type="button"
        className="fab"
        aria-label="添加灵感"
        onClick={() => navigate('/inspire/new')}
      >
        +
      </button>
    </div>
  )
}
