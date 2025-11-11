# JSON-LD Checker

JSON-LD Checker is a Chromium extension that inspects, validates, and visualizes JSON-LD structured data directly from the browser side panel.

## Highlights

- Auto-detects JSON-LD on any page and surfaces status in the toolbar icon.
- Side panel views for a collapsible tree, raw JSON, validation summary, and AI-powered insights.
- Built-in validator covering missing fields, wrong data types, malformed URLs, and SEO recommendations.
- AI Check explains issues in existing markup; AI Suggest drafts production-ready JSON-LD even when none exists.
- Internationalized UI with automatic language detection and manual language switcher (System / English / 中文).

## Install

1. Clone or download this repository.
2. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
3. Choose **Load unpacked** and select the project directory.

Optional: run `node create-icons.js` (requires `npm install canvas`) to regenerate icons.

## Getting Started

1. Browse to any page and open the side panel from the extension icon.
2. Switch between tabs to inspect tree, raw JSON, validation, AI Check, or AI Suggest.
3. Use the dropdown when multiple JSON-LD blocks are detected.

### Configure AI

1. Click the ⚙️ button to open the settings page.
2. Enter your OpenAI API key, test the connection, then save.
3. AI responses follow the selected language preference.

## Development Notes

- Manifest V3 + vanilla JavaScript; no build step required.
- Source overview: background worker, content script, side panel UI, validator, AI service, and settings page.
- After editing files, refresh the extension from `chrome://extensions`.

## Contributing & License

Pull requests and issues are welcome.

Released under the MIT License.
