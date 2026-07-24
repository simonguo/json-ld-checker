# Chrome Web Store assets

Generated listing assets:

- `screenshots/01-inspector.png` — 1280×800
- `screenshots/02-issues.png` — 1280×800
- `screenshots/03-ai-tools.png` — 1280×800
- `screenshots/04-providers.png` — 1280×800
- `promo-small.png` — 440×280
- `promo-marquee.png` — 1400×560

The PNG files are opaque 24-bit images suitable for Chrome Web Store upload.
Their reproducible visual fixtures live in `tests/visual/`.

Run `npm run dev:visual`, then open:

```text
/tests/visual/store-assets.html?asset=screenshot-inspector
/tests/visual/store-assets.html?asset=screenshot-issues
/tests/visual/store-assets.html?asset=screenshot-ai
/tests/visual/store-assets.html?asset=screenshot-settings
/tests/visual/store-assets.html?asset=promo-small
/tests/visual/store-assets.html?asset=promo-marquee
```
