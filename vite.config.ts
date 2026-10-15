import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** Pages: /closet-lite/ · Capacitor/native: /  (set VITE_BASE=/ npm run build:native) */
const base = process.env.VITE_BASE || '/closet-lite/'

/**
 * onnxruntime-web is dynamically imported by @imgly/background-removal.
 * Vite emits its .wasm into dist/assets (~24MB), but the library loads WASM
 * from config.publicPath (public/bg-removal/). Drop duplicate emits.
 */
function dropBundledOrtWasm(): Plugin {
  return {
    name: 'drop-bundled-ort-wasm',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith('.wasm') && /ort-wasm/i.test(fileName)) {
          delete bundle[fileName]
        }
      }
    },
  }
}

export default defineConfig({
  base,
  plugins: [
    dropBundledOrtWasm(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'app-version.json'],
      manifest: {
        name: 'Closet Lite',
        short_name: 'Closet Lite',
        description: 'On-device digital closet. Your data stays on your phone.',
        theme_color: '#3478F6',
        background_color: '#F2F2F2',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'en',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        globIgnores: ['**/bg-removal/**'],
        navigateFallback: `${base}index.html`.replace(/\/{2,}/g, '/'),
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
})
