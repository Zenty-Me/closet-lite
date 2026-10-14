import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isLang, translate, type Lang } from './index'
import { loadSettings, saveSettings } from '../utils/settings'

type I18nCtx = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const Ctx = createContext<I18nCtx | null>(null)

function readLang(): Lang {
  const lang = loadSettings().language
  return isLang(lang) ? lang : 'zh'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readLang())

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    const cur = loadSettings()
    saveSettings({ ...cur, language: next })
    try {
      document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN'
    } catch {
      /* ignore */
    }
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
