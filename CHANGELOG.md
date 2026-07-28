# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.5.0] - 2026-07-28

### Added

- Source-preserving JSON-LD scanning with exact line, column, excerpt, and caret
  diagnostics for malformed blocks.
- Top-level array, `@graph`, nested typed-entity, and block-to-entity support.
- Live rescanning for JSON-LD inserted or changed while the side panel is open.
- One-click Google Rich Results Test and Schema.org Markup Validator links.
- Full `<script>` copy, raw-block download, and HTML/PDF-ready inspection reports.
- Optional all-sites automatic detection and a one-time, non-incentivized rating
  invitation.
- English and Simplified Chinese manifest and store-listing localization.
- Product site, practical guides, press kit, release video script, and 90-day
  organic growth playbook.

### Changed

- Default permissions now use `activeTab`; all-sites access is requested only
  when automatic detection is explicitly enabled.
- Local Schema.org checks, Google eligibility, and local SEO suggestions are
  described as separate validation boundaries.
- Store screenshots now lead with core inspection and reporting; AI remains an
  optional fifth feature.

### Removed

- Required `<all_urls>` access and the `notifications` permission.

## [2.4.0] - 2026-07-24

### Added

- Open-source project documentation, policies, templates, and automation.

## [2.3.2] - 2026-07-24

### Added

- Chrome DevTools-style Inspector, Issues, and History views.
- JSONPath-aware validation and issue-to-tree navigation.
- Local Source drafts and validation report export.
- Redesigned settings with provider-specific configuration.
- Current global and Chinese AI providers plus custom model IDs and endpoints.
- Vitest and React Testing Library coverage.

### Changed

- AI tools are now secondary actions instead of primary navigation tabs.
- Azure OpenAI uses the v1 Chat Completions endpoint.
- Current reasoning models use provider-compatible token and sampling
  parameters.

[Unreleased]: https://github.com/simonguo/json-ld-checker/compare/v2.5.0...HEAD
[2.5.0]: https://github.com/simonguo/json-ld-checker/releases/tag/v2.5.0
[2.4.0]: https://github.com/simonguo/json-ld-checker/releases/tag/v2.4.0
[2.3.2]: https://github.com/simonguo/json-ld-checker/releases/tag/v2.3.2
