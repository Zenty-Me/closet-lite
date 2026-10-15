# Closet Lite

Overseas freemium pilot of the on-device digital closet (forked from [qing-yichu](https://github.com/Zenty-Me/qing-yichu) / 轻衣橱).

**Closet Lite** keeps your wardrobe on-device (IndexedDB). Free tier includes monthly cutout and smart-outfit quotas; Pro unlocks unlimited cutouts, smart outfits, and backup export. Stripe Checkout is stubbed until secrets are wired.

## Try the PWA

1. Open on your phone:  
   **https://zenty-me.github.io/closet-lite/**
2. Safari (iOS) or Chrome (Android) recommended.

### Add to Home Screen

- **iPhone (Safari)**: Share → Add to Home Screen  
- **Android (Chrome)**: Menu → Add to Home Screen / Install app

## Android APK (Capacitor)

```bash
npm install
npm run android:sync    # fetch bg-removal model + VITE_BASE=/ build + cap sync
npm run android:open
```

- Web `base`: GitHub Pages uses `/closet-lite/`; native builds use `/` (`npm run build:native`).
- App id: `com.zenty.closetlite`
- CI workflow `android-debug.yml` can produce a **debug APK** artifact.

## Freemium (pilot)

| Free | Pro (stub) |
|------|------------|
| Monthly cutout + smart outfit quotas | Unlimited cutouts & smart outfits |
| On-device closet | JSON backup export / import |
| | Cloud sync — coming soon |

Local Pro toggle exists for testing until Stripe Price IDs are configured (do not commit secrets).

## Background removal (self-hosted)

```bash
npm run fetch:bg-removal   # ~76MB into public/bg-removal/ (gitignored)
```

Pages deploy fetches the model in CI.

## Local development

```bash
npm install
npm run fetch:bg-removal   # optional, for cutout
npm run dev
npm run build              # Pages build (base=/closet-lite/)
```

Default UI language is **English**; Chinese remains available in Me → Language.

## Privacy

All data stays in the browser / app **IndexedDB**. Export a backup before you switch phones.

## License

MIT (background-removal model follows IMG.LY `@imgly/background-removal-data` terms)
