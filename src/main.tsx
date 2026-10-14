import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import { scheduleCutoutWarmup } from './utils/cutout'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Warm ONNX off the critical path so the first 「去背景」 is faster.
scheduleCutoutWarmup()
