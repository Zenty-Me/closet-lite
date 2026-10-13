import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteInspiration, getInspiration, saveInspiration, uid } from '../db'
import { compressImage } from '../utils/image'
import { ImagePicker } from '../components/ImagePicker'
import { ImageEditor } from '../components/ImageEditor'
import { Toast } from '../components/Toast'

export function InspireForm() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [ready, setReady] = useState(isNew)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (isNew) return
    void (async () => {
      const row = await getInspiration(id!)
      if (!row) {
        navigate('/inspire')
        return
      }
      setNote(row.note)
      setTagsText(row.tags.join(' '))
      setImageBlob(row.imageBlob)
      setReady(true)
    })()
  }, [id, isNew, navigate])

  const onSave = async () => {
    if (!imageBlob) {
      setToast('请添加一张图片')
      return
    }
    setSaving(true)
    const now = Date.now()
    const existing = !isNew ? await getInspiration(id!) : undefined
    const inspId = existing?.id ?? uid()
    await saveInspiration({
      id: inspId,
      imageBlob,
      note: note.trim(),
      tags: tagsText
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
      relatedItemIds: existing?.relatedItemIds ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
    })
    setSaving(false)
    navigate(`/inspire/${inspId}`, { replace: true })
  }

  const onDelete = async () => {
    if (!id || isNew) return
    if (!confirm('确定删除这条灵感？')) return
    await deleteInspiration(id)
    navigate('/inspire', { replace: true })
  }

  if (!ready) return null

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="page-title">{isNew ? '添加灵感' : '编辑灵感'}</h1>
      {imageBlob ? (
        <ImageEditor
          blob={imageBlob}
          enableCutout={false}
          onChange={setImageBlob}
        />
      ) : null}
      <ImagePicker onPick={async (f) => {
        try {
          setImageBlob(await compressImage(f))
        } catch {
          setToast('图片处理失败')
        }
      }} />
      <div className="form-group">
        <label className="form-label" htmlFor="note">备注</label>
        <textarea
          id="note"
          className="form-textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="喜欢哪里？适合什么场合？"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="tags">标签</label>
        <input
          id="tags"
          className="form-input"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="约会 旅行"
        />
      </div>
      <div className="form-actions">
        {!isNew && (
          <button type="button" className="btn btn-danger" onClick={() => void onDelete()}>
            删除
          </button>
        )}
        <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void onSave()}>
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
