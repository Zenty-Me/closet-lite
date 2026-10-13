# 轻衣橱 visual identity (v2 — White Minimal)

## Direction
Clean digital closet: light gray canvas, pure white cards, system blue accents.
Inspired by 无忧衣橱’s clarity — **do not** copy trademark/brand assets; **do** match the calm minimal product feel.
Photos stay the hero; UI is quiet chrome.

## Palette
| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F2F2F2` | App canvas (light gray) |
| `--paper` | `#F5F5F5` | Soft placeholders |
| `--surface` | `#FFFFFF` | Cards, sheets, nav |
| `--ink` | `#1A1A1A` | Primary text |
| `--muted` | `#8E8E93` | Secondary text |
| `--line` | `#E5E5EA` | Hairline borders |
| `--accent` | `#3478F6` | FAB, active tab, primary buttons, links |
| `--accent-soft` | `#E8F0FE` | Soft blue wash / chip active bg |
| `--success` | `#34C759` | 使用中 pills |
| `--danger` | `#FF3B30` | Destructive |

Self-check: **not** purple SaaS, **not** linen/olive paper, **not** cream+terracotta.

## Type
- Entire UI: **Noto Sans SC** + PingFang / system sans
- No editorial serif titles
- No ALL-CAPS labels

## Layout
- Card radius ~**12px**; modest hairlines; light shadow optional (`--shadow`)
- Category section cards: white on gray canvas, horizontal cutout rails
- Circular blue FAB; white bottom nav with blue active state
- Color pickers use swatches (hex storage)

## Principles
1. Photos = hero  
2. Restraint — one accent blue  
3. Typography stays sans and quiet  
4. Motion only for press; honor `prefers-reduced-motion`

## Cutout assets
Self-hosted under `public/bg-removal/` via `npm run fetch:bg-removal` (isnet_quint8 ≈76MB, not in git).
CDN fallback if local missing.
