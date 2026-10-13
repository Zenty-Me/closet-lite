import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/qing-yichu/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '轻衣橱',
        short_name: '轻衣橱',
        description: '本地电子衣橱，数据只存在你的手机里',
        theme_color: '#7C6AF2',
        background_color: '#F7F5FF',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'zh-CN',
        start_url: '/qing-yichu/',
        scope: '/qing-yichu/',
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
        navigateFallback: '/qing-yichu/index.html',
      },
    }),
  ],
})
