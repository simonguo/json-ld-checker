# Chrome Web Store 90-day measurement sheet

Fill this sheet immediately before publishing the release. Keep raw dashboard exports in a private analytics folder; do not commit user-level data or credentials.

## Baseline — previous 90 days

| Metric | Value | Export/source |
| --- | ---: | --- |
| Store impressions | TBD | Chrome Web Store dashboard |
| Installs | TBD | Chrome Web Store dashboard |
| Uninstalls | TBD | Chrome Web Store dashboard |
| Net installs | `installs - uninstalls` | Calculated |
| Active users | ~824 (replace with export) | Chrome Web Store dashboard |
| Ratings | 3 | Store listing |
| Average rating | 4.7 | Store listing |
| Net installs per 1,000 impressions | TBD | `(installs - uninstalls) / impressions × 1000` |
| Install-to-uninstall ratio | TBD | `uninstalls / installs` |

## Targets — first 90 days after release

| Metric | Target |
| --- | --- |
| Active users | At least 1,500 |
| Net installs per 1,000 impressions | At least 25% above baseline |
| Install-to-uninstall ratio | At least 20% below baseline |
| Ratings | At least 10 |
| Average rating | At least 4.7 |

## Weekly review

Track impressions, installs, uninstalls, users, ratings, publishing events, and content/referral launches each Monday. Compare seven-day and trailing-28-day values; do not react to a single-day spike.

Enable Chrome Web Store-managed GA4 for listing attribution. Do not add behavioral analytics to the extension. Review organic performance for 60 days before considering a small paid keyword or Product Hunt experiment.
