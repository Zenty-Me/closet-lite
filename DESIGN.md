# 轻衣橱 visual identity (v1.2)

## Direction: Linen Closet Lookbook
Quiet boutique lookbook for a personal phone wardrobe — clothes photos are the star; UI stays calm and tactile. Not a SaaS dashboard.

## Palette
| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F3EFE7` | Warm linen paper |
| `--surface` | `#FFFBF5` | Soft paper cards |
| `--ink` | `#1C1916` | Deep ink text |
| `--muted` | `#6E675E` | Secondary text |
| `--line` | `#DDD5C8` | Quiet borders |
| `--accent` | `#3D4A2E` | Deep olive (fashion atelier) |
| `--accent-soft` | `#E4E8DB` | Soft olive wash |

Self-check: not purple SaaS, not cream+terracotta, not acid green, not broadsheet.

## Type
- Titles: **Noto Serif SC** (one editorial moment)
- UI: **Noto Sans SC** + PingFang / system
- No ALL-CAPS labels

## Layout
- Photo-forward 2-col grids, tight gaps, light borders, almost no shadow
- Understated filter chips (small radius, not candy pills)
- Quiet bottom nav; simple olive FAB without glow
- Flat panels for suggest/insight (no card-in-card nesting)

## Principles
1. Photos = hero
2. Restraint — one accent, one serif title treatment
3. Chanel rule: remove decorative purple chrome
4. Motion only for press feedback; honor `prefers-reduced-motion`

## Batch 2 — cutout strategy
「去背景」uses `@imgly/background-removal` loaded from jsDelivr on first use
(CDN ESM + IMG.LY-hosted ONNX/WASM). Keeps GitHub Pages / PWA shell small;
processing stays in-browser after download. Needs network the first time.
