import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** Pages: /qing-yichu/ · Capacitor/native: /  (set VITE_BASE=/ npm run build:native) */
const base = process.env.VITE_BASE || '/qing-yichu/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '轻衣橱',
        short_name: '轻衣橱',
        description: '本地电子衣橱，数据只存在你的手机里',
        theme_color: '#3478F6',
        background_color: '#F2F2F2',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'zh-CN',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Large ONNX/WASM chunks for cutout — cache selectively when present
        globIgnores: ['**/bg-removal/**'],
        navigateFallback: `${base}index.html`.replace(/\/{2,}/g, '/'),
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
})
