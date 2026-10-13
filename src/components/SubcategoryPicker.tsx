import { useState } from 'react'
import type { Category } from '../types'
import {
  addSubcategoryLabel,
  loadSettings,
  mergeSubcategoryOptions,
  saveSettings,
  type AppSettings,
} from '../utils/settings'

interface Props {
  category: Category
  value: string
  onChange: (v: string) => void
  /** Extra names seen on items (merged into chips) */
  usedNames?: string[]
  settings?: AppSettings
  onSettingsChange?: (s: AppSettings) => void
}

export function SubcategoryPicker({
  category,
  value,
  onChange,
  usedNames = [],
  settings: settingsProp,
  onSettingsChange,
}: Props) {
  const [localSettings, setLocalSettings] = useState(() => settingsProp ?? loadSettings())
  const [customOpen, setCustomOpen] = useState(false)
  const [customText, setCustomText] = useState('')

  const settings = settingsProp ?? localSettings
  const options = mergeSubcategoryOptions(settings, category, usedNames)

  const persist = (next: AppSettings) => {
    saveSettings(next)
    setLocalSettings(next)
    onSettingsChange?.(next)
  }

  const pick = (name: string) => {
    onChange(name)
  }

  const addCustom = () => {
    const n = customText.trim()
    if (!n) return
    const next = addSubcategoryLabel(settings, category, n)
    persist(next)
    onChange(n)
    setCustomText('')
    setCustomOpen(false)
  }

  return (
    <div className="subcat-picker">
      <div className="chip-select">
        <button
          type="button"
          className={`chip${!value ? ' active' : ''}`}
          onClick={() => pick('')}
        >
          未分子类
        </button>
        {options.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip${value === s ? ' active' : ''}`}
            onClick={() => pick(s)}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          className={`chip${customOpen ? ' active' : ''}`}
          onClick={() => setCustomOpen((v) => !v)}
        >
          自定义…
        </button>
      </div>
      {customOpen && (
        <div className="subcat-custom-row">
          <input
            className="form-input"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="例如：开衫"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
          />
          <button type="button" className="btn btn-primary" onClick={addCustom}>
            添加
          </button>
        </div>
      )}
    </div>
  )
}
