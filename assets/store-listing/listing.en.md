# Chrome Web Store listing — English

## Name

JSON-LD Checker – Schema Validator

## Summary

Inspect JSON-LD, pinpoint syntax errors, validate Schema.org structure, and export focused reports without leaving the page.

## Detailed description

JSON-LD Checker is a focused, open-source tool for developers, technical SEO teams, agencies, and site owners who need to understand structured data on the current page.

### What it does

- Preserves every JSON-LD block, including malformed blocks that other tools may report as missing.
- Pinpoints JSON syntax errors with the exact line, column, source excerpt, and original block.
- Understands top-level arrays, `@graph`, multiple blocks, and nested typed entities.
- Navigates local Schema.org findings back to the relevant JSONPath.
- Opens the current URL in Google Rich Results Test or Schema.org Markup Validator.
- Copies complete `<script>` tags, downloads original blocks, and creates HTML/PDF-ready reports.

### Common uses

- Debug Product, Article, Organization, LocalBusiness, BreadcrumbList, FAQPage, and other Schema.org markup.
- Review templates before release.
- Compare page markup with CMS or ecommerce data.
- Share a compact inspection report with developers, clients, or QA teams.

### Clear validation boundaries

The extension distinguishes local Schema.org structure checks and SEO suggestions from official platform validation. Google rich-result eligibility must still be confirmed in Google Rich Results Test.

### Privacy and permissions

Core inspection and validation run locally. The default install uses `activeTab`, so the extension reads a page only after you invoke it there. Optional automatic detection requests access to all sites only when you enable that setting, and revokes the permission when you turn it off.

There is no extension analytics, advertising, or project-operated telemetry. Optional AI tools are disabled until you configure and invoke a provider.

### FAQ

**Does it change my page?**

No. Source edits are local drafts and never modify the inspected website.

**Why does it show more items than `<script>` blocks?**

One block can contain a top-level array, `@graph`, or nested typed entities. The inspector keeps the connection between every entity and its source block.

**Does a local “valid” result guarantee a Google rich result?**

No. Use the built-in shortcut to confirm eligibility with Google Rich Results Test.

Source code, privacy policy, documentation, and issue tracker are available from the project website.
