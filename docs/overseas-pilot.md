# Overseas PWA pilot — foundation (zenty)

Locked for US English pilot (local-first):

| Plan | Limits |
|------|--------|
| Free | Unlimited local items; cutout **5/month**; smart outfit **3/month**; basic closet/outfit free |
| Pro | **$39/year** or **$4.99/month** — unlimited cutout + outfit + JSON backup export/import; **cloud sync Coming soon** |
| Credit pack | **$4.99 / 50 uses** (non-subscribers) — UI stub until Stripe |

## Shipped in app (no Stripe secrets)

- zh (default) + en i18n; language switch in Profile, persisted in settings
- Monthly quotas in IndexedDB `appMeta` (`usageQuota`); calendar-month reset; `settings.isPro` bypass
- Cutout + smart outfit enforce quota + upgrade CTA
- JSON backup export/import gated to Pro; CSV remains free
- Profile plan status + Upgrade page with checkout placeholders
- Local Pro toggle on Upgrade for testing

## Blocked on zenty

1. **Stripe account secrets** — `STRIPE_SECRET_KEY`, publishable key, Price IDs (yearly / monthly / credit pack). Wire Checkout; do not commit secrets.
2. **English copy polish** — current en strings are pilot drafts; 产品经理 may refine US wording / product name (“Light Closet” vs keep 轻衣橱).
3. Cloud sync — mark Coming soon only; no backend in this sprint.
4. Amazon Associates — later.

## Version

App version / build: see `src/version.ts` and `public/app-version.json`.
