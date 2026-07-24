# Extension updates and releases

JSON-LD Checker relies on Chrome's native extension update mechanism. The
extension does not run its own timer or contact a separate update service.

## Installed extensions

Extensions installed from the Chrome Web Store are updated by Chrome. The
**Check for updates** action in Settings calls
`chrome.runtime.requestUpdateCheck`; Chrome may report that an update is
available, that no update is available, or that the request was throttled.

An unpacked development build does not receive Chrome Web Store updates.
Reload it from `chrome://extensions` after running `npm run build`.

## Release checklist

1. Update the same version in `package.json` and `manifest.json`.
2. Move relevant entries from `Unreleased` in `CHANGELOG.md` into the release.
3. Run `npm run check`.
4. Commit the release changes and create a signed or annotated `vX.Y.Z` tag.
5. Push the commit and tag to GitHub.
6. Upload the generated ZIP to the Chrome Web Store and complete its review
   process.

The release workflow validates the project, packages `dist/`, and attaches the
ZIP to a GitHub Release. It does not publish to the Chrome Web Store.

`npm run check:version` prevents releases when the package and manifest
versions differ.

## Update state

Chrome's `runtime.onInstalled` and `runtime.onUpdateAvailable` events update
the extension's local notification state. Existing settings, history, and AI
provider configuration remain in Chrome Storage and are not migrated or
uploaded as part of an update.

References:

- [Chrome extension update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)
- [`chrome.runtime` API](https://developer.chrome.com/docs/extensions/reference/api/runtime)
