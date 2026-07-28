# 90-day organic growth playbook

This playbook starts after the release has passed the permission, regression,
and store-listing checks. It does not authorize posting from project or personal
accounts; each external publication still requires an owner and account review.

## Positioning

One sentence:

> JSON-LD Checker is the source-preserving, privacy-first Chrome extension for
> diagnosing JSON-LD syntax, structure, and reportable issues.

Stay focused on JSON-LD. Do not present the extension as a general SEO audit
suite, and do not describe local checks as Google validation.

## Release gates

- Fresh installation has no default “read all websites” warning.
- Clicking the toolbar action successfully inspects the active page.
- Optional automatic detection requests all-sites access only from a user
  gesture, stops immediately when disabled, and survives permission revocation.
- Invalid JSON, top-level arrays, `@graph`, multiple blocks, nested entities,
  dynamic injection, Unicode/emoji URLs, and restricted pages have been tested.
- Every claim in both store listings can be reproduced in the published build.
- Previous 90-day store metrics are exported and the baseline sheet is filled.
- Chrome Web Store-managed GA4 is enabled for listing attribution; no analytics
  is added to the extension.

## Channel sequence

### Days 1–14: listing and owned channels

1. Publish the release, localized English and Simplified Chinese listings, five
   screenshots, privacy policy, and product site.
2. Publish both practical guides on the product site.
3. Announce the release through the repository release notes and existing owned
   social accounts.
4. Reply to every new store review and GitHub issue.

### Days 15–35: searchable republishing

- English: adapt each guide for Dev.to, Medium, and Hashnode. Use canonical links
  when the platform supports them and link to the Chrome Web Store.
- Chinese: adapt for 掘金 plus one of 知乎 or SegmentFault. Avoid posting an
  identical block of text across every site on the same day.
- Each version must include a real broken-markup example, screenshots from the
  current release, source-code links, and a request for technical feedback.

Suggested UTM convention:

```text
utm_source={devto|medium|hashnode|juejin|zhihu|segmentfault}
utm_medium=content
utm_campaign=jsonld_checker_2_5
utm_content={malformed|validators}
```

Use UTM parameters only on the product-site link. Chrome Web Store-managed GA4
can attribute the visit without adding telemetry to the extension.

### Days 36–55: community feedback

Post one community at a time, at least four days apart:

1. `r/TechSEO`
2. `r/bigseo`
3. `r/SEO`
4. `r/chrome_extensions`

Format:

- Start with a debugging problem or open-source implementation detail.
- Show the exact before/after behavior.
- State that you maintain the extension.
- Link the source code before the store link.
- Ask one concrete feedback question.
- Do not repost if moderators remove it, and do not coordinate votes.

Example opening:

> I found that our old JSON-LD scanner silently discarded blocks when
> `JSON.parse` failed, so the UI could say “no JSON-LD” on a page that actually
> had broken markup. I changed the model to preserve every script and attach a
> line/column error. I would value feedback on the block-to-entity handling for
> `@graph` and nested typed objects.

### Days 45–70: editorial outreach

Prepare individual notes for:

- The author of the Medium SEO toolbox article that recommends the competing
  extension.
- The editor of the French “best SEO Chrome extensions” list.
- Current “best SEO Chrome extensions,” technical SEO, Schema.org, WordPress,
  and Shopify tutorial authors whose content has a genuine structured-data
  section.

Pitch the evidence, not a generic directory submission: open-source repository,
minimal-permission design, exact malformed-JSON diagnostics, reports, and a
short demo. Offer editorial screenshots and a direct technical contact.

Do not upload CRX files to unofficial download sites. Automated directories can
index the official Chrome Web Store listing without creating a second software
distribution channel.

### Days 60–90: evaluate and expand

- Compare trailing-28-day metrics with the baseline every week.
- If net installs per 1,000 impressions is at least 25% above baseline, test one
  small paid keyword campaign or a carefully prepared Product Hunt launch.
- If uninstall ratio is not improving, pause promotion and investigate
  permission prompts, unsupported pages, unclear validation claims, and first
  session usability.
- Start German and Spanish listing translation only after English and Chinese
  screenshots and copy have stabilized.

## Rating invitation policy

The extension may show one non-incentivized invitation after either three
distinct pages have been inspected or the first report has been opened for
export. Dismissal is permanent. Do not gate features, offer rewards, or repeat
the prompt.

## Weekly measurement

Track:

- store impressions;
- installs and uninstalls;
- active users;
- net installs per 1,000 impressions;
- install-to-uninstall ratio;
- rating count and average;
- content/referral launches;
- qualitative issues and review themes.

The 90-day targets are at least 1,500 active users, 25% higher net installs per
1,000 impressions, 20% lower install-to-uninstall ratio, at least 10 ratings,
and an average rating of at least 4.7.
