import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllItems, saveItem } from '../db'
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type Category,
} from '../types'
import {
  addSubcategoryLabel,
  loadSettings,
  removeSubcategoryLabel,
  renameSubcategoryLabel,
  saveSettings,
  getSubcategories,
  type AppSettings,
} from '../utils/settings'
import { Toast } from '../components/Toast'

export function CategoryManage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [main, setMain] = useState<Category>('上衣')
  const [newName, setNewName] = useState('')
  const [toast, setToast] = useState('')
  const [usage, setUsage] = useState<Record<string, number>>({})

  const refreshUsage = useCallback(async () => {
    const items = await getAllItems()
    const map: Record<string, number> = {}
    for (const it of items) {
      if (it.category !== main) continue
      const s = it.subcategory.trim()
      if (!s) continue
      map[s] = (map[s] ?? 0) + 1
    }
    setUsage(map)
  }, [main])

  useEffect(() => {
    void refreshUsage()
  }, [refreshUsage])

  const persist = (next: AppSettings) => {
    saveSettings(next)
    setSettings(next)
  }

  const list = getSubcategories(settings, main)
  // include orphan labels still on items
  const orphans = Object.keys(usage).filter((s) => !list.includes(s))
  const display = [...list, ...orphans]

  const onAdd = () => {
    const n = newName.trim()
    if (!n) {
      setToast('请输入子分类名称')
      return
    }
    persist(addSubcategoryLabel(settings, main, n))
    setNewName('')
    setToast(`已添加「${n}」`)
  }

  const onRename = (from: string) => {
    const to = prompt(`重命名「${from}」为：`, from)?.trim()
    if (!to || to === from) return
    void (async () => {
      const next = renameSubcategoryLabel(settings, main, from, to)
      persist(next)
      const items = await getAllItems()
      let n = 0
      for (const it of items) {
        if (it.category === main && it.subcategory === from) {
          await saveItem({ ...it, subcategory: to, updatedAt: Date.now() })
          n++
        }
      }
      await refreshUsage()
      setToast(n ? `已重命名，并更新 ${n} 件单品` : '已重命名')
    })()
  }

  const onDelete = (name: string) => {
    const count = usage[name] ?? 0
    let clearItems = false
    if (count > 0) {
      const choice = confirm(
        `「${name}」下有 ${count} 件单品。\n确定：仅从列表移除标签（单品仍保留该子分类文字）\n取消：放弃删除\n\n若要同时清空这些单品的子分类，请先点确定后再在下一面确认。`,
      )
      if (!choice) return
      clearItems = confirm(`是否清空这 ${count} 件单品的子分类字段？`)
    } else if (!confirm(`删除子分类「${name}」？`)) {
      return
    }
    void (async () => {
      persist(removeSubcategoryLabel(settings, main, name))
      if (clearItems) {
        const items = await getAllItems()
        for (const it of items) {
          if (it.category === main && it.subcategory === name) {
            await saveItem({ ...it, subcategory: '', updatedAt: Date.now() })
          }
        }
      }
      await refreshUsage()
      setToast(clearItems ? `已删除并清空 ${count} 件` : '已删除标签')
    })()
  }

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      <h1 className="page-title">管理分类</h1>
      <p className="page-sub">主分类固定；子分类可自定义（例如上衣下的开衫）。删除标签不会强制删单品。</p>

      <div className="form-group">
        <div className="form-label">主分类</div>
        <div className="chip-select">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${main === c ? ' active' : ''}`}
              onClick={() => setMain(c)}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <section className="insight-section">
        <h3 className="insight-title">{CATEGORY_LABEL[main]} 子分类</h3>
        {display.length === 0 ? (
          <p className="insight-hint">还没有子分类，在下方添加（例如：开衫、短袖）</p>
        ) : (
          <ul className="subcat-manage-list">
            {display.map((s) => (
              <li key={s} className="subcat-manage-row">
                <div>
                  <strong>{s}</strong>
                  <span className="subcat-manage-meta">
                    {usage[s] ? `${usage[s]} 件` : '未使用'}
                    {orphans.includes(s) ? ' · 仅在单品上' : ''}
                  </span>
                </div>
                <div className="subcat-manage-actions">
                  <button type="button" className="btn-text" onClick={() => onRename(s)}>
                    重命名
                  </button>
                  <button type="button" className="btn-text danger-text" onClick={() => onDelete(s)}>
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="subcat-custom-row" style={{ marginTop: 12 }}>
          <input
            className="form-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新子分类名称"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAdd()
              }
            }}
          />
          <button type="button" className="btn btn-primary" onClick={onAdd}>
            添加
          </button>
        </div>
      </section>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
