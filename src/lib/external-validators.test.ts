import { describe, expect, it } from 'vitest';
import {
  buildGoogleRichResultsUrl,
  buildSchemaValidatorUrl,
  isExternallyValidatableUrl,
} from './external-validators';

describe('external validator links', () => {
  const pageUrl = 'https://example.com/über-uns?q=emoji 😀&next=/a?b=c';

  it('round-trips Unicode and query strings for Google Rich Results Test', () => {
    const result = new URL(buildGoogleRichResultsUrl(pageUrl));
    expect(result.origin + result.pathname).toBe(
      'https://search.google.com/test/rich-results',
    );
    expect(result.searchParams.get('url')).toBe(pageUrl);
  });

  it('encodes the complete URL for Schema.org Markup Validator', () => {
    const result = buildSchemaValidatorUrl(pageUrl);
    expect(decodeURIComponent(result.split('#url=')[1])).toBe(pageUrl);
  });

  it('rejects extension and local file URLs', () => {
    expect(isExternallyValidatableUrl('chrome-extension://id/page.html')).toBe(false);
    expect(isExternallyValidatableUrl('file:///tmp/test.html')).toBe(false);
  });
});
