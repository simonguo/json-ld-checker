# Store localization workflow

## Launch locales

- `en` — source copy and screenshots
- `zh_CN` — localized name, summary, detailed description, and screenshots

The runtime manifest messages live under `_locales/`. Chrome Web Store listing
copy is maintained separately in this directory because dashboard listing fields
and localized screenshots are not packaged with the extension.

## Next locales

Add German and Spanish after the English and Simplified Chinese conversion data
has stabilized. Translate from approved English copy, then have a native or
professional reviewer check terminology such as JSON-LD, structured data,
Schema.org, rich results, parsing error, and optional permissions.

## Screenshot rules

- Keep the feature order identical across locales.
- Localize headline, explanation, bullet copy, visible interface, and alt text.
- Never show API keys, personal browsing data, or claims that are not reproducible
  in the uploaded version.
- Export opaque 24-bit PNG files at exactly 1280×800.
