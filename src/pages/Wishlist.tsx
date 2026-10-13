import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  deleteWishlistItem,
  getAllWishlist,
  saveWishlistItem,
  uid,
} from '../db'
import type { WishlistItem } from '../types'
import { compressImage } from '../utils/image'
import { useBlobUrl } from '../hooks/useBlobUrl'
import { EmptyState } from '../components/EmptyState'
import { Toast } from '../components/Toast'
import { ImagePicker } from '../components/ImagePicker'
import { openPurchaseLink, openTaobao, openPinduoduo } from '../utils/shop'

function WishThumb({ blob }: { blob?: Blob }) {
  const url = useBlobUrl(blob ?? null)
  if (!url) return <div className="wish-thumb wish-thumb-empty">想买</div>
  return <img className="wish-thumb" src={url} alt="" />
}

export function Wishlist() {
  const navigate = useNavigate()
  const [list, setList] = useState<WishlistItem[]>([])
  const [filter, setFilter] = useState<'all' | 'open' | 'bought'>('open')
  const [toast, setToast] = useState('')
  const [editing, setEditing] = useState<WishlistItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [priceNote, setPriceNote] = useState('')
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [imageBlob, setImageBlob] = useState<Blob | undefined>()

  const load = useCallback(async () => {
    setList(await getAllWishlist())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setName('')
    setPriceNote('')
    setLink('')
    setNote('')
    setImageBlob(undefined)
    setShowForm(true)
  }

  const openEdit = (w: WishlistItem) => {
    setEditing(w)
    setName(w.name)
    setPriceNote(w.priceNote)
    setLink(w.link)
    setNote(w.note)
    setImageBlob(w.imageBlob)
    setShowForm(true)
  }

  const save = async () => {
    if (!name.trim()) {
      setToast('请填写名称')
      return
    }
    const now = Date.now()
    await saveWishlistItem({
      id: editing?.id ?? uid(),
      name: name.trim(),
      priceNote: priceNote.trim(),
      link: link.trim(),
      note: note.trim(),
      imageBlob,
      bought: editing?.bought ?? false,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    })
    setShowForm(false)
    setToast('已保存')
    await load()
  }

  const toggleBought = async (w: WishlistItem) => {
    await saveWishlistItem({ ...w, bought: !w.bought, updatedAt: Date.now() })
    await load()
  }

  const remove = async (w: WishlistItem) => {
    if (!confirm(`删除「${w.name}」？`)) return
    await deleteWishlistItem(w.id)
    await load()
    setToast('已删除')
  }

  const shown = list.filter((w) => {
    if (filter === 'open') return !w.bought
    if (filter === 'bought') return w.bought
    return true
  })

  return (
    <div className="page-with-fab">
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="page-title">想买</h1>
      <p className="page-sub">记下心动单品，买到后可勾选「已买」</p>

      <div className="chip-select" style={{ marginBottom: 14 }}>
        {(
          [
            ['open', '未买'],
            ['bought', '已买'],
            ['all', '全部'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`chip${filter === k ? ' active' : ''}`}
            onClick={() => setFilter(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title={filter === 'bought' ? '还没有已买记录' : '心愿单是空的'}
          description="记下想买的衣服、价格和链接"
          actionLabel="添加想买"
          onAction={openNew}
        />
      ) : (
        <div className="wish-list">
          {shown.map((w) => (
            <div key={w.id} className={`wish-card${w.bought ? ' bought' : ''}`}>
              <button type="button" className="wish-card-main" onClick={() => openEdit(w)}>
                <WishThumb blob={w.imageBlob} />
                <div className="wish-card-body">
                  <div className="wish-card-title">{w.name}</div>
                  {w.priceNote && <div className="wish-card-meta">{w.priceNote}</div>}
                  {w.link && (
                    <div className="wish-card-link">已保存购买链接</div>
                  )}
                  {w.note && <div className="wish-card-note">{w.note}</div>}
                </div>
              </button>
              <div className="wish-card-actions">
                {w.link ? (
                  <button type="button" className="btn-text" onClick={() => openPurchaseLink(w.link)}>
                    打开链接
                  </button>
                ) : null}
                <button type="button" className="btn-text" onClick={() => openTaobao(w.name)}>
                  淘宝
                </button>
                <button type="button" className="btn-text" onClick={() => openPinduoduo(w.name)}>
                  拼多多
                </button>
                <button type="button" className="btn-text" onClick={() => void toggleBought(w)}>
                  {w.bought ? '标为未买' : '已买'}
                </button>
                <button type="button" className="btn-text danger-text" onClick={() => void remove(w)}>
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="fab" aria-label="添加想买" onClick={openNew}>
        +
      </button>

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">{editing ? '编辑想买' : '添加想买'}</div>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：米色风衣" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">价格备注</label>
              <input className="form-input" value={priceNote} onChange={(e) => setPriceNote(e.target.value)} placeholder="约 ¥599 / 打折中" />
            </div>
            <div className="form-group">
              <label className="form-label">链接</label>
              <input className="form-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" inputMode="url" />
            </div>
            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="尺码、颜色想法…" />
            </div>
            {imageBlob ? (
              <WishThumb blob={imageBlob} />
            ) : null}
            <ImagePicker
              onPick={async (f) => {
                try {
                  setImageBlob(await compressImage(f))
                } catch {
                  setToast('图片处理失败')
                }
              }}
            />
            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => void save()}>
              保存
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
