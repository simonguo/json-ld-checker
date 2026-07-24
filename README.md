# JSON-LD Checker

[![CI](https://github.com/simonguo/json-ld-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/simonguo/json-ld-checker/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg)](manifest.json)

JSON-LD Checker is an open-source Chromium extension for inspecting, validating,
and improving JSON-LD structured data without leaving the current page. Its UI
follows Chrome DevTools conventions so developers can scan schemas, locate
issues, and review source data quickly.

[简体中文](README.zh-CN.md)

## Features

- Detects JSON-LD blocks on the current page and reports their status in the
  extension icon.
- Provides a DevTools-style side panel with Inspector, Issues, and History.
- Switches cleanly between multiple schemas and identifies each schema by
  `@type`.
- Validates nested objects, arrays, and `@graph` entries with precise JSONPath
  locations.
- Opens an issue directly in the Inspector and falls back to the nearest
  existing ancestor for missing fields.
- Offers a local Source draft editor that never modifies the inspected page.
- Exports JSON-LD and validation reports.
- Optionally reviews or drafts JSON-LD through OpenAI, Anthropic, Gemini, Azure
  OpenAI, OpenRouter, DeepSeek, Qwen, Kimi, Zhipu GLM, MiniMax, Ollama, or a
  custom OpenAI-compatible endpoint.
- Supports English and Simplified Chinese.

## Requirements

- Chrome 114+, Microsoft Edge 114+, or another compatible Chromium browser.
- Node.js 20.19+ and npm 10+ for local development.

## Install from Source

```bash
git clone https://github.com/simonguo/json-ld-checker.git
cd json-ld-checker
npm ci
npm run build
```

Then:

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the generated `dist/` directory.

## Development

```bash
npm run dev          # Start the extension development server
npm run dev:visual   # Open the standalone side-panel visual harness
npm run type-check   # Run TypeScript checks
npm test             # Run the Vitest test suite
npm run build        # Create a production build
npm run licenses     # Refresh third-party software notices
npm run check        # Run the full CI validation sequence
```

Local JSON-LD fixtures are available in `tests/fixtures/`.

## AI Configuration

AI features are optional. Open the extension settings, select a provider and
model, then enter the provider API key. Custom endpoints require a complete
Chat Completions URL and an exact model ID.

API keys are stored in Chrome local extension storage. When an AI feature is
used, relevant page information is sent directly to the provider selected by
the user. See [Privacy](PRIVACY.md) for details.

## Permissions

The extension requests access to all page URLs so it can inspect JSON-LD on the
active page. It also uses:

- `activeTab` and `scripting` to scan the current page on demand.
- `sidePanel` to host the developer interface.
- `storage` for settings, local drafts, and history.
- `notifications` for extension update notifications.

JSON-LD inspection and local validation run in the browser. The project does
not include analytics or telemetry.

## Project Structure

```text
src/
├── components/ui/       Shared DevTools-style primitives
├── config/              Provider and project metadata
├── lib/                 Validation, paths, history, AI, and i18n
├── pages/options/       Settings page
└── pages/sidepanel/     Inspector, Issues, History, and AI tools
tests/
├── fixtures/            Manual JSON-LD test pages
└── visual/              Standalone side-panel visual harness
```

## Contributing

Issues and pull requests are welcome. Please read
[CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

Security vulnerabilities should be reported privately according to
[SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE). Bundled dependencies and their
licenses are listed in [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt).
