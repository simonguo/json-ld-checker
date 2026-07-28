# Chrome Web Store assets

Generated listing assets:

- `screenshots/01-inspector.png` — 1280×800
- `screenshots/02-syntax-error.png` — 1280×800
- `screenshots/03-issues.png` — 1280×800
- `screenshots/04-report.png` — 1280×800
- `screenshots/05-ai-tools.png` — 1280×800
- `screenshots/zh-CN/01-inspector.png` through `05-ai-tools.png` — localized
  Simplified Chinese screenshots at 1280×800
- `promo-small.png` — 440×280
- `promo-marquee.png` — 1400×560

The PNG files are opaque 24-bit images suitable for Chrome Web Store upload.
Their reproducible visual fixtures live in `tests/visual/`.

Run `npm run dev:visual`, then open:

```text
/store-assets.html?asset=screenshot-inspector
/store-assets.html?asset=screenshot-parse-error
/store-assets.html?asset=screenshot-issues
/store-assets.html?asset=screenshot-report
/store-assets.html?asset=screenshot-ai
/store-assets.html?asset=screenshot-inspector&lang=zh-CN
/store-assets.html?asset=promo-small
/store-assets.html?asset=promo-marquee
```

Store copy and launch operations:

- `listing.en.md` and `listing.zh-CN.md` — localized listing copy
- `video-script.md` — 50-second demonstration script and captions
- `metrics-baseline.md` — pre-release baseline and 90-day target sheet
- `LOCALIZATION.md` — screenshot and next-locale workflow
