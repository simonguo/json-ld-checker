# Privacy

Last updated: July 24, 2026

JSON-LD Checker is designed to perform its core inspection and validation work
locally in the browser.

## Data Processed Locally

The extension may read the following information from the active page:

- JSON-LD script contents;
- page URL and title;
- the page meta description when generating an AI draft.

JSON-LD validation, issue navigation, local Source drafts, settings, and scan
history are processed or stored in Chrome extension storage on the user's
device.

## Optional AI Features

AI features are disabled until the user configures a provider. When the user
explicitly runs AI Review or Generate Draft, relevant JSON-LD and basic page
information are sent directly to the selected provider or custom endpoint.
That provider's privacy policy and terms apply.

API keys are stored in Chrome local extension storage and are sent only to the
configured provider endpoint for authenticated requests. The project does not
operate an intermediary API server. The extension does not separately encrypt
these keys, so users should protect their browser profile and device account.

## Data Not Collected by This Project

The extension does not include analytics, advertising, telemetry, user
tracking, or a project-operated remote database. The maintainers do not receive
page data, history, settings, drafts, or API keys through the extension.

## Permissions

Access to page URLs is required to inspect JSON-LD on the active tab.
`scripting`, `sidePanel`, `storage`, and `notifications` support scanning, the
side-panel UI, local preferences, and update notices respectively.

## Clearing Data

Users can clear AI configuration and browsing history from the extension
settings. Uninstalling the extension removes its Chrome-managed local storage.

Questions can be sent to
[simonguo.2009@gmail.com](mailto:simonguo.2009@gmail.com).
