#!/usr/bin/env node
/**
 * Prove bg-removal chunk URLs would be served as real files by Capacitor Android
 * WebViewLocalServer (html5mode), and that a HTTP probe matching cutout.ts succeeds
 * against a local static tree that mirrors android assets/public.
 *
 * Capacitor rule (WebViewLocalServer.handleLocalRequest):
 *   if lastPathSegment has no `.` && html5mode → return index.html (SPA)
 *   else if path contains `.` → open asset
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BG = path.join(ROOT, 'public', 'bg-removal')
const resourcesPath = path.join(BG, 'resources.json')

function capacitorWouldServeAsSpa(urlPath) {
  const seg = urlPath.split('/').filter(Boolean).pop() || ''
  return !seg.includes('.')
}

function mainAssertLayout() {
  if (!existsSync(resourcesPath)) {
    throw new Error('missing public/bg-removal/resources.json — run npm run fetch:bg-removal')
  }
  const resources = JSON.parse(readFileSync(resourcesPath, 'utf8'))
  const model = resources['/models/isnet_quint8']
  if (!model?.chunks?.length) throw new Error('missing isnet_quint8 chunks')

  let checked = 0
  for (const [key, entry] of Object.entries(resources)) {
    for (const c of entry.chunks || []) {
      checked++
      if (!c.name.includes('.')) {
        throw new Error(
          `chunk name lacks extension (Capacitor SPA trap): key=${key} name=${c.name}`,
        )
      }
      const urlPath = `/bg-removal/${c.name}`
      if (capacitorWouldServeAsSpa(urlPath)) {
        throw new Error(`Capacitor would SPA-fallback: ${urlPath}`)
      }
      const file = path.join(BG, c.name)
      if (!existsSync(file)) throw new Error(`missing file: ${c.name}`)
      const size = statSync(file).size
      const expected = c.offsets[1] - c.offsets[0]
      if (size !== expected) {
        throw new Error(`size mismatch ${c.name}: disk=${size} expected=${expected}`)
      }
    }
  }
  console.log(`layout OK: ${checked} chunks have extensions and match sizes`)
  return resources
}

/** Minimal static server: Capacitor-like — extensionless → fake index.html */
function startCapacitorLikeServer(rootPublic) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1')
      let rel = decodeURIComponent(url.pathname)
      if (rel.endsWith('/')) rel += 'index.html'
      const seg = rel.split('/').filter(Boolean).pop() || ''
      if (!seg.includes('.')) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<!doctype html><html><body>spa</body></html>')
        return
      }
      const file = path.join(rootPublic, rel.replace(/^\//, ''))
      if (!existsSync(file)) {
        res.writeHead(404)
        res.end('missing')
        return
      }
      const data = readFileSync(file)
      const range = req.headers.range
      if (range) {
        const m = /bytes=(\d+)-(\d*)/.exec(range)
        if (m) {
          const start = Number(m[1])
          const end = m[2] ? Number(m[2]) : Math.min(start + 63, data.length - 1)
          const slice = data.subarray(start, end + 1)
          res.writeHead(206, {
            'Content-Type': 'application/octet-stream',
            'Content-Range': `bytes ${start}-${end}/${data.length}`,
            'Accept-Ranges': 'bytes',
          })
          res.end(slice)
          return
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' })
      res.end(data)
    })
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, port })
    })
  })
}

function looksLikeHtml(bytes) {
  const head = Buffer.from(bytes).toString('utf8', 0, 64).toLowerCase().trimStart()
  return head.startsWith('<!doctype') || head.startsWith('<html')
}

async function probeLikeCutout(origin) {
  const pathBase = `${origin}/bg-removal/`
  const res = await fetch(new URL('resources.json', pathBase).href, { method: 'GET', cache: 'no-store' })
  if (!res.ok) throw new Error(`resources.json ${res.status}`)
  const json = await res.json()
  const model = json['/models/isnet_quint8']
  if (!model) throw new Error('no model key')
  const first = model.chunks?.[0]?.name
  if (!first?.includes('.')) throw new Error(`bad first chunk name: ${first}`)

  let chunkRes = await fetch(new URL(first, pathBase).href, {
    method: 'GET',
    cache: 'no-store',
    headers: { Range: 'bytes=0-63' },
  })
  if (!chunkRes.ok && chunkRes.status !== 206) {
    chunkRes = await fetch(new URL(first, pathBase).href, { method: 'GET', cache: 'no-store' })
  }
  if (!chunkRes.ok && chunkRes.status !== 206) throw new Error(`chunk ${chunkRes.status}`)
  const buf = new Uint8Array(await chunkRes.arrayBuffer())
  if (buf.length === 0 || looksLikeHtml(buf)) {
    throw new Error('chunk probe got HTML/empty (SPA fallback)')
  }
  console.log(`probe OK: ${pathBase} → first chunk ${first} (${buf.length} bytes sampled)`)
}

async function assertLegacyWouldFail(origin) {
  // Extensionless URL must be treated as SPA by Capacitor-like server
  const res = await fetch(`${origin}/bg-removal/deadbeefcafebabe`)
  const text = await res.text()
  if (!text.toLowerCase().includes('<!doctype') && !text.toLowerCase().includes('<html')) {
    throw new Error('expected SPA HTML for extensionless path')
  }
  console.log('legacy trap confirmed: extensionless path → HTML')
}

async function main() {
  mainAssertLayout()
  // Serve repo public/ as Capacitor assets/public
  const publicRoot = path.join(ROOT, 'public')
  const { server, port } = await startCapacitorLikeServer(publicRoot)
  const origin = `http://127.0.0.1:${port}`
  try {
    await assertLegacyWouldFail(origin)
    await probeLikeCutout(origin)
  } finally {
    server.close()
  }
  console.log('verify-capacitor-bg-removal: ALL PASSED')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
