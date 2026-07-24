# JSON-LD Checker

JSON-LD Checker is a Chromium extension that inspects, validates, and visualizes JSON-LD structured data directly from the browser side panel.

## Highlights

- Auto-detects JSON-LD on any page and surfaces status in the toolbar icon.
- Developer-focused side panel with Inspector, Issues, History, and secondary AI tools.
- Built-in validator covering missing fields, wrong data types, malformed URLs, and SEO recommendations.
- Validation issues include JSONPath locations that jump back to the relevant tree node.
- AI Review explains existing markup; Generate Draft proposes JSON-LD even when none exists.
- Internationalized UI with automatic language detection and manual language switcher (System / English / 中文).

## Install

1. Clone or download this repository.
2. Run `npm install` and `npm run build`.
3. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
4. Choose **Load unpacked** and select the generated `dist/` directory.

Optional: run `node create-icons.js` (requires `npm install canvas`) to regenerate icons.

## Getting Started

1. Browse to any page and open the side panel from the extension icon.
2. Use Inspector for the tree or local source draft, and Issues for validation results.
3. Use the schema selector when multiple JSON-LD blocks are detected; open AI from the compact toolbar when needed.

### Configure AI

1. Click the ⚙️ button to open the settings page.
2. Enter your OpenAI API key, test the connection, then save.
3. AI responses follow the selected language preference.

## Development Notes

- Manifest V3 + React + TypeScript, built with Vite and CRXJS.
- Run `npm run type-check`, `npm test`, and `npm run build` before loading `dist/` as an unpacked extension.
- Local JSON-LD QA pages live in `tests/fixtures/`.

## Contributing & License

Pull requests and issues are welcome.

Released under the MIT License.
