import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { scheduleCutoutWarmup } from './utils/cutout'
import { I18nProvider } from './i18n/I18nProvider'
import { getLang } from './i18n'

try {
  document.documentElement.lang = getLang() === 'en' ? 'en' : 'zh-CN'
} catch {
  /* ignore */
}

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)

// Warm ONNX off the critical path so the first 「去背景」 is faster.
scheduleCutoutWarmup()
