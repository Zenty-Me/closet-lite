# 轻衣橱 visual identity (v2.1 — White Minimal, craft)

## Direction
Clean digital closet: light gray canvas, pure white cards, system blue accents.
Closer to 无忧衣橱 **density** (photo-forward lists, quiet chrome) — not trademark/brand assets.
Photos are the hero; UI is structure, not decoration.

## Palette (LOCKED — do not restyle)
| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#F2F2F2` | App canvas |
| `--paper` | `#F5F5F5` | Placeholders |
| `--surface` | `#FFFFFF` | Cards, sheets, nav |
| `--ink` | `#1A1A1A` | Primary text |
| `--muted` | `#8E8E93` | Secondary |
| `--line` | `#E5E5EA` | Hairlines |
| `--accent` | `#3478F6` | FAB, active tab, primary |
| `--accent-soft` | `#E8F0FE` | Soft chip active |
| `--success` | `#34C759` | 使用中 |
| `--danger` | `#FF3B30` | Destructive |

PWA `theme_color` = `#3478F6`, `background_color` = `#F2F2F2`.

## Craft (what we optimize instead of color)
- **Density:** tighter page padding, quieter section spacing — mobile app, not dashboard
- **Chrome:** hairline borders only; `--shadow: none` — no soft grey under every card
- **Radius hierarchy:** chips/inputs ~6px; cards ~10px — not one radius on everything
- **Chips:** outline / soft fill when active — not candy solid pills everywhere
- **FAB:** solid accent circle, **no glow**
- **Type:** Noto Sans SC / PingFang only; titles via weight + slight negative tracking
- **Motion:** press opacity only; no staggered fade-ins
- Avoid SaaS tells: nested identical cards, meta joined with middle dots, `→` on every action, stats-as-hero

## Principles
1. Photos = hero  
2. Palette locked; craft is density/type/chrome  
3. One accent blue, used sparingly  
4. Touch ≥44px; safe-area; honor `prefers-reduced-motion`

## Cutout assets
`npm run fetch:bg-removal` → `public/bg-removal/` (≈76MB, gitignored). CDN fallback if missing.
