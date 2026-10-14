import { en } from './en'
import { zh } from './zh'
import type { Dict, Lang } from './types'
import { loadSettings } from '../utils/settings'

const DICTS: Record<Lang, Dict> = { zh, en }

export type { Lang, Dict }
export { zh, en }

export function isLang(v: unknown): v is Lang {
  return v === 'zh' || v === 'en'
}

export function getLang(): Lang {
  const lang = loadSettings().language
  return isLang(lang) ? lang : 'zh'
}

export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const dict = DICTS[lang] ?? zh
  let s = dict[key] ?? zh[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{{${k}}}`, String(v))
    }
  }
  return s
}

/** Non-React helper — reads current language from settings */
export function t(key: string, vars?: Record<string, string | number>): string {
  return translate(getLang(), key, vars)
}
